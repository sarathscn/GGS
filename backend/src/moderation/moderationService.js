const mongoose = require('mongoose');
const { OFFENSIVE_TERMS, ALL_TERMS, SEVERITY, CATEGORIES } = require('./dictionary/offensiveTerms');
const { normalizeText, normalizeManglishPhonetics } = require('./normalizeText');
const ModerationRecord = require('../models/ModerationRecord');
const ModerationTerm = require('../models/ModerationTerm');

// Legitimate English words containing banned substrings as subparts (False-Positive Whitelist)
const FALSE_POSITIVE_WHITELIST = new Set([
  'class', 'classes', 'classic', 'classical', 'classify', 'classified',
  'glass', 'glasses', 'grass', 'pass', 'passed', 'passage', 'passenger',
  'mass', 'massive', 'brass', 'bass', 'compass', 'trespass',
  'assistant', 'assistance', 'assist', 'assets', 'asset', 'assume', 'assuming',
  'assumption', 'assess', 'assessment', 'assassin', 'assassinate', 'assemble',
  'assembly', 'assert', 'assertion', 'associate', 'association', 'assign',
  'assignment', 'assort', 'assorted', 'embarrass', 'harass', 'harassment',
  'document', 'documentation', 'cocktail', 'peacock', 'cockpit', 'shuttlecock',
  'shoe', 'shoes', 'shoemaker', 'horseshoe', 'hoeing',
  'button', 'butter', 'butterfly',
  'theri', 'theriyum', 'theriyilla' // Tamil/Malayalam for "knows/doesn't know"
]);

// In-memory dynamic dictionary cache
let cachedAllTerms = null;
let cachedManglishTerms = null;
let lastCacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000;

// Helper to escape regex special characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Seed initial moderation terms into MongoDB if empty (non-destructive)
 */
async function seedDefaultModerationTermsIfEmpty() {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return;
    }
    const count = await ModerationTerm.countDocuments();
    if (count === 0) {
      console.log('🌱 Initializing Database-Backed Moderation Dictionary from Seed List...');
      const docs = ALL_TERMS.map(t => ({
        id: require('uuid').v4(),
        term: t.term,
        language: t.language,
        category: t.category || 'profanity',
        severity: t.severity || 'HIGH',
        enabled: true,
        variants: t.variants || [],
        transliterations: t.transliterations || [],
        is_seed: true,
        created_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      await ModerationTerm.insertMany(docs, { ordered: false }).catch(() => {});
      console.log(`✅ Loaded ${docs.length} seed moderation terms into MongoDB`);
    }
  } catch (err) {
    console.error('Error seeding moderation terms:', err.message);
  }
}

/**
 * Invalidate in-memory cache so next read fetches fresh data from DB
 */
function invalidateModerationDictionaryCache() {
  cachedAllTerms = null;
  cachedManglishTerms = null;
  lastCacheTimestamp = 0;
}

/**
 * Asynchronously reload the active terms from MongoDB into cache
 */
async function loadActiveModerationTermsFromDb() {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await seedDefaultModerationTermsIfEmpty();
      const dbTerms = await ModerationTerm.find({ enabled: true }).lean();
      if (dbTerms && dbTerms.length > 0) {
        const formatted = dbTerms.map(t => ({
          id: t.id,
          term: t.term,
          language: t.language,
          category: t.category,
          severity: t.severity,
          enabled: t.enabled,
          variants: t.variants || [],
          transliterations: t.transliterations || [],
          is_phrase: t.term.includes(' ')
        }));

        // Expand variants if any term has registered variants
        const expandedTerms = [];
        const manglishList = [];

        for (const t of formatted) {
          expandedTerms.push(t);
          if (t.language === 'malayalam_transliteration') {
            manglishList.push(t);
          }
          if (t.variants && t.variants.length > 0) {
            for (const v of t.variants) {
              if (v && v.trim() && v.trim() !== t.term) {
                const variantEntry = {
                  ...t,
                  term: v.trim(),
                  is_phrase: v.trim().includes(' ')
                };
                expandedTerms.push(variantEntry);
                if (t.language === 'malayalam_transliteration') {
                  manglishList.push(variantEntry);
                }
              }
            }
          }
        }

        cachedAllTerms = expandedTerms;
        cachedManglishTerms = manglishList;
        lastCacheTimestamp = Date.now();
        return cachedAllTerms;
      }
    }
  } catch (err) {
    console.error('Failed to load terms from DB, using fallback dictionary:', err.message);
  }

  // Fallback to static seed list if DB is unreachable
  cachedAllTerms = ALL_TERMS;
  cachedManglishTerms = OFFENSIVE_TERMS.malayalam_transliteration;
  lastCacheTimestamp = Date.now();
  return cachedAllTerms;
}

/**
 * Synchronous getter for current active dictionary terms
 */
function getActiveTermsSync() {
  if (cachedAllTerms && (Date.now() - lastCacheTimestamp < CACHE_TTL_MS)) {
    return cachedAllTerms;
  }
  // Trigger background refresh if stale
  loadActiveModerationTermsFromDb().catch(() => {});
  return cachedAllTerms || ALL_TERMS;
}

function getActiveManglishTermsSync() {
  if (cachedManglishTerms && (Date.now() - lastCacheTimestamp < CACHE_TTL_MS)) {
    return cachedManglishTerms;
  }
  loadActiveModerationTermsFromDb().catch(() => {});
  return cachedManglishTerms || OFFENSIVE_TERMS.malayalam_transliteration;
}

/**
 * Detect Offensive Content in Text
 * 
 * Evaluates the input string across standard, normalized, condensed, and phonetic representations.
 */
function detectOffensiveContent(rawText, customTerms = null) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return {
      hasMatches: false,
      matches: [],
      severity: SEVERITY.SAFE,
      confidence: 0,
      detectedLanguages: [],
      highestSeverity: SEVERITY.SAFE,
      cleanText: rawText || ''
    };
  }

  const termsList = customTerms || getActiveTermsSync();
  const manglishList = getActiveManglishTermsSync();

  const normalized = normalizeText(rawText);
  const matches = [];
  const detectedLanguages = new Set();
  let highestSeverityRank = 0;

  const SEVERITY_RANKS = {
    [SEVERITY.SAFE]: 0,
    [SEVERITY.LOW]: 1,
    [SEVERITY.MEDIUM]: 2,
    [SEVERITY.HIGH]: 3,
    [SEVERITY.CRITICAL]: 4
  };

  const addMatch = (termEntry, matchedSlice, matchIndex) => {
    const lowerSlice = matchedSlice.toLowerCase().trim();
    if (FALSE_POSITIVE_WHITELIST.has(lowerSlice)) {
      return;
    }

    detectedLanguages.add(termEntry.language);
    const rank = SEVERITY_RANKS[termEntry.severity] || 0;
    if (rank > highestSeverityRank) {
      highestSeverityRank = rank;
    }

    matches.push({
      term: termEntry.term,
      category: termEntry.category,
      language: termEntry.language,
      severity: termEntry.severity,
      matchedText: matchedSlice,
      index: matchIndex
    });
  };

  // 1. Exact & Phrase Matching on Standard and Condensed Views
  for (const entry of termsList) {
    if (!entry.enabled && entry.enabled !== undefined) continue;

    const term = entry.term;
    const isMalayalam = entry.language === 'malayalam';
    const isPhrase = entry.is_phrase || term.includes(' ');

    if (isMalayalam) {
      // Malayalam Script Matching
      const escaped = escapeRegex(term);
      const malRegex = new RegExp(escaped, 'gi');
      
      let m;
      while ((m = malRegex.exec(normalized.malayalam)) !== null) {
        addMatch(entry, m[0], m.index);
      }
    } else if (isPhrase) {
      // Multi-word phrase matching with flexible spacing/punctuation between words
      const words = term.split(/\s+/).map(escapeRegex);
      const phraseRegexStr = `(?:^|[^a-zA-Z0-9])${words.join('[\\s.*+_\\-\\/~`\\\\!@#$%^&=]+')}(?:$|[^a-zA-Z0-9])`;
      const phraseRegex = new RegExp(phraseRegexStr, 'gi');

      let m;
      phraseRegex.lastIndex = 0;
      while ((m = phraseRegex.exec(normalized.condensed)) !== null) {
        const full = m[0];
        const trimmed = full.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
        addMatch(entry, trimmed, m.index);
      }

      phraseRegex.lastIndex = 0;
      while ((m = phraseRegex.exec(normalized.standard)) !== null) {
        const full = m[0];
        const trimmed = full.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
        addMatch(entry, trimmed, m.index);
      }
    } else {
      // Single word Latin / Transliteration matching with strict word boundaries
      const escaped = escapeRegex(term);
      const wordRegex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, 'gi');
      
      let m;
      wordRegex.lastIndex = 0;
      while ((m = wordRegex.exec(normalized.standard)) !== null) {
        const full = m[0];
        const trimmed = full.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
        addMatch(entry, trimmed, m.index);
      }

      wordRegex.lastIndex = 0;
      while ((m = wordRegex.exec(normalized.condensed)) !== null) {
        const full = m[0];
        const trimmed = full.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
        addMatch(entry, trimmed, m.index);
      }

      if (normalized.condensedDouble) {
        wordRegex.lastIndex = 0;
        while ((m = wordRegex.exec(normalized.condensedDouble)) !== null) {
          const full = m[0];
          const trimmed = full.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
          addMatch(entry, trimmed, m.index);
        }
      }

      if (normalized.lettersOnly) {
        wordRegex.lastIndex = 0;
        while ((m = wordRegex.exec(normalized.lettersOnly)) !== null) {
          const full = m[0];
          const trimmed = full.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
          addMatch(entry, trimmed, m.index);
        }
      }

      if (normalized.baseAlphaOnly) {
        wordRegex.lastIndex = 0;
        while ((m = wordRegex.exec(normalized.baseAlphaOnly)) !== null) {
          const full = m[0];
          const trimmed = full.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
          addMatch(entry, trimmed, m.index);
        }
      }
    }
  }

  // 2. Transliteration / Phonetic Variant Checking
  for (const entry of manglishList) {
    if (!entry.enabled && entry.enabled !== undefined) continue;
    const term = entry.term;
    const phoneticTarget = normalizeManglishPhonetics(term);
    const escaped = escapeRegex(phoneticTarget);
    const phoneticRegex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, 'gi');

    let m;
    phoneticRegex.lastIndex = 0;
    while ((m = phoneticRegex.exec(normalized.phonetic)) !== null) {
      const full = m[0];
      const trimmed = full.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
      addMatch(entry, trimmed, m.index);
    }

    if (normalized.lettersOnlyPhonetic) {
      phoneticRegex.lastIndex = 0;
      while ((m = phoneticRegex.exec(normalized.lettersOnlyPhonetic)) !== null) {
        const full = m[0];
        const trimmed = full.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
        addMatch(entry, trimmed, m.index);
      }
    }

    if (normalized.baseAlphaOnlyPhonetic) {
      phoneticRegex.lastIndex = 0;
      while ((m = phoneticRegex.exec(normalized.baseAlphaOnlyPhonetic)) !== null) {
        const full = m[0];
        const trimmed = full.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
        addMatch(entry, trimmed, m.index);
      }
    }
  }

  // Deduplicate matches
  const uniqueMatches = [];
  const seenKey = new Set();
  for (const match of matches) {
    const key = `${match.term}:${match.matchedText.toLowerCase()}`;
    if (!seenKey.has(key)) {
      seenKey.add(key);
      uniqueMatches.push(match);
    }
  }

  let computedSeverity = SEVERITY.SAFE;
  for (const [sev, rank] of Object.entries(SEVERITY_RANKS)) {
    if (rank === highestSeverityRank) {
      computedSeverity = sev;
      break;
    }
  }

  let cleanText = rawText;
  for (const match of uniqueMatches) {
    try {
      const esc = escapeRegex(match.matchedText);
      const maskRegex = new RegExp(esc, 'gi');
      cleanText = cleanText.replace(maskRegex, (m) => '*'.repeat(m.length));
    } catch (e) {}
  }

  let confidence = 0;
  if (uniqueMatches.length > 0) {
    confidence = Math.min(0.85 + (uniqueMatches.length * 0.05), 0.99);
  }

  return {
    hasMatches: uniqueMatches.length > 0,
    matches: uniqueMatches,
    severity: computedSeverity,
    confidence: Number(confidence.toFixed(2)),
    detectedLanguages: Array.from(detectedLanguages),
    cleanText
  };
}

/**
 * Authoritative Server-Side Moderation Function
 */
async function moderateText(text, context = {}) {
  const {
    type = 'post_description', // username, full_name, post_title, post_description, message, review, search
    userId = null,
    userName = null,
    contentId = null,
    autoRecord = true
  } = context;

  if (!cachedAllTerms || (Date.now() - lastCacheTimestamp > CACHE_TTL_MS)) {
    await loadActiveModerationTermsFromDb();
  }

  const detection = detectOffensiveContent(text);

  let action = 'ALLOW';
  let isProhibited = false;

  if (detection.hasMatches) {
    if (
      detection.severity === SEVERITY.CRITICAL ||
      detection.severity === SEVERITY.HIGH ||
      (detection.severity === SEVERITY.MEDIUM && (type === 'username' || type === 'full_name' || type === 'post_title' || type === 'search'))
    ) {
      action = 'BLOCK';
      isProhibited = true;
    } else if (detection.severity === SEVERITY.MEDIUM || detection.severity === SEVERITY.LOW) {
      action = type === 'message' ? 'FLAG' : 'BLOCK';
      isProhibited = type !== 'message';
    }
  }

  const result = {
    isProhibited,
    action,
    flagged: detection.hasMatches,
    severity: detection.severity,
    confidence: detection.confidence,
    matches: detection.matches,
    cleanText: detection.cleanText,
    originalText: text,
    languages: detection.detectedLanguages,
    reason: detection.hasMatches 
      ? `Contains ${detection.severity.toLowerCase()} severity terms (${detection.matches.map(m => m.term).join(', ')})`
      : 'Passed moderation'
  };

  if (detection.hasMatches && autoRecord) {
    try {
      const record = new ModerationRecord({
        content_type: type,
        content_id: contentId,
        user_id: userId,
        user_name: userName,
        original_text: text,
        normalized_text: normalizeText(text).standard,
        filtered_text: detection.cleanText,
        matched_terms: detection.matches.map(m => ({
          term: m.term,
          category: m.category,
          language: m.language,
          severity: m.severity,
          matched_slice: m.matchedText
        })),
        language: detection.detectedLanguages.join(', ') || 'mixed',
        severity: detection.severity,
        confidence: detection.confidence,
        action_taken: action === 'BLOCK' ? 'AUTO_BLOCKED' : 'FLAGGED',
        status: 'pending'
      });

      await record.save();
      result.recordId = record.id;
    } catch (recordErr) {
      console.error('Failed to save ModerationRecord:', recordErr);
    }
  }

  return result;
}

module.exports = {
  detectOffensiveContent,
  moderateText,
  seedDefaultModerationTermsIfEmpty,
  loadActiveModerationTermsFromDb,
  invalidateModerationDictionaryCache,
  SEVERITY,
  CATEGORIES,
  FALSE_POSITIVE_WHITELIST
};
