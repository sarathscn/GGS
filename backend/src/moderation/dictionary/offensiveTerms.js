/**
 * Centralized Multilingual Offensive Terms Dictionary
 * 
 * Supports:
 * - English Offensive Terms & Profanity
 * - Malayalam Offensive Terms (Native Malayalam Script)
 * - Malayalam Transliteration (Manglish / Latin Script)
 * - Common Obfuscated & Symbol Patterns
 * 
 * Each entry contains metadata for categorization, language detection, and severity levels.
 */

const SEVERITY = {
  SAFE: 'SAFE',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

const CATEGORIES = {
  PROFANITY: 'profanity',
  SEXUAL: 'sexual',
  SLUR: 'slur',
  HARASSMENT: 'harassment',
  INSULT: 'insult',
  OBFUSCATED: 'obfuscated'
};

// Seed Lists as requested by the specification
const ENGLISH_TERMS = [
  { term: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'fucking', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'fucked', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'fucker', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'motherfucker', severity: SEVERITY.CRITICAL, category: CATEGORIES.PROFANITY },
  { term: 'mf', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'shit', severity: SEVERITY.MEDIUM, category: CATEGORIES.PROFANITY },
  { term: 'bullshit', severity: SEVERITY.MEDIUM, category: CATEGORIES.PROFANITY },
  { term: 'bitch', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT },
  { term: 'bitches', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT },
  { term: 'ass', severity: SEVERITY.LOW, category: CATEGORIES.PROFANITY },
  { term: 'arse', severity: SEVERITY.LOW, category: CATEGORIES.PROFANITY },
  { term: 'asshole', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT },
  { term: 'arsehole', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT },
  { term: 'bastard', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT },
  { term: 'dick', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'dickhead', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT },
  { term: 'cock', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'cocksucker', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'pussy', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'cunt', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'whore', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'slut', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'hoe', severity: SEVERITY.MEDIUM, category: CATEGORIES.SLUR },
  { term: 'hooker', severity: SEVERITY.MEDIUM, category: CATEGORIES.SLUR },
  { term: 'wanker', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'jerkoff', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'jackass', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'dumbass', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'dipshit', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT },
  { term: 'shithead', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT },
  { term: 'fuckhead', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT },
  { term: 'asshat', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'prick', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'twat', severity: SEVERITY.HIGH, category: CATEGORIES.SLUR },
  { term: 'crap', severity: SEVERITY.LOW, category: CATEGORIES.PROFANITY },
  { term: 'damn', severity: SEVERITY.LOW, category: CATEGORIES.PROFANITY },
  { term: 'dammit', severity: SEVERITY.LOW, category: CATEGORIES.PROFANITY },
  { term: 'piss', severity: SEVERITY.LOW, category: CATEGORIES.PROFANITY },
  { term: 'pissed', severity: SEVERITY.LOW, category: CATEGORIES.PROFANITY },
  { term: 'piss off', severity: SEVERITY.MEDIUM, category: CATEGORIES.HARASSMENT, is_phrase: true },
  { term: 'son of a bitch', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT, is_phrase: true },
  { term: 'piece of shit', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT, is_phrase: true }
];

const MALAYALAM_TERMS = [
  { term: 'തെറി', severity: SEVERITY.MEDIUM, category: CATEGORIES.PROFANITY },
  { term: 'തെറിയൻ', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'തെറിവിളി', severity: SEVERITY.MEDIUM, category: CATEGORIES.PROFANITY },
  { term: 'പട്ടി', severity: SEVERITY.LOW, category: CATEGORIES.INSULT },
  { term: 'പട്ടിക്കുട്ടി', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'നായ', severity: SEVERITY.LOW, category: CATEGORIES.INSULT },
  { term: 'നായിന്റെ മോൻ', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT, is_phrase: true },
  { term: 'നായിന്റെ മോൾ', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT, is_phrase: true },
  { term: 'പൂറ്', severity: SEVERITY.CRITICAL, category: CATEGORIES.SEXUAL },
  { term: 'പൂറി', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'പൂറിമോൻ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'പൂറിമോൾ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'പൂറൻ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'പൂറത്തി', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'കുണ്ണ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SEXUAL },
  { term: 'കുണ്ണൻ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'കുണ്ണമോൻ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'കുണ്ണപ്പൻ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'കുണ്ണപ്പൂറി', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'അണ്ടി', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'അണ്ടൻ', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'അണ്ടിപ്പൻ', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT },
  { term: 'മൈര്', severity: SEVERITY.CRITICAL, category: CATEGORIES.PROFANITY },
  { term: 'മൈരൻ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'മൈരത്തി', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'മൈരേ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'മൈരേടെ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'ചാണകം', severity: SEVERITY.LOW, category: CATEGORIES.INSULT },
  { term: 'തായോളി', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'തായോളി മോൻ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR, is_phrase: true },
  { term: 'തേവിടിച്ചി', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'വെടി', severity: SEVERITY.HIGH, category: CATEGORIES.SLUR },
  { term: 'വെടിച്ചി', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'വേശ്യ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'പിമ്പ്', severity: SEVERITY.HIGH, category: CATEGORIES.SLUR },
  { term: 'കോപ്പേ', severity: SEVERITY.MEDIUM, category: CATEGORIES.PROFANITY },
  { term: 'കോപ്പ്', severity: SEVERITY.MEDIUM, category: CATEGORIES.PROFANITY },
  { term: 'നാറി', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'നാറിയവൻ', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'നാറിയവൾ', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'ഊമ്പ്', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'ഊമ്പൻ', severity: SEVERITY.HIGH, category: CATEGORIES.SLUR },
  { term: 'ഊമ്പി', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'ഊമ്പിക്കോ', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'ഊമ്പിക്കൊ', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'ഊമ്പിയ', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'മൂത്രം', severity: SEVERITY.LOW, category: CATEGORIES.PROFANITY },
  { term: 'പൂറ്റിൽ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SEXUAL },
  { term: 'പൂറിൽ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SEXUAL },
  { term: 'കൂതി', severity: SEVERITY.CRITICAL, category: CATEGORIES.SEXUAL },
  { term: 'കൂതറ', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'കൂതിക്കാരൻ', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'കൂതിച്ചി', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR }
];

const MALAYALAM_TRANSLITERATION_TERMS = [
  { term: 'myr', severity: SEVERITY.CRITICAL, category: CATEGORIES.PROFANITY },
  { term: 'myire', severity: SEVERITY.CRITICAL, category: CATEGORIES.PROFANITY },
  { term: 'myre', severity: SEVERITY.CRITICAL, category: CATEGORIES.PROFANITY },
  { term: 'mairu', severity: SEVERITY.CRITICAL, category: CATEGORIES.PROFANITY },
  { term: 'maire', severity: SEVERITY.CRITICAL, category: CATEGORIES.PROFANITY },
  { term: 'mairan', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'mairathi', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'poor', severity: SEVERITY.CRITICAL, category: CATEGORIES.SEXUAL },
  { term: 'poori', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'poore', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'pooran', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'poorimone', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'poorimol', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'kunna', severity: SEVERITY.CRITICAL, category: CATEGORIES.SEXUAL },
  { term: 'kunn', severity: SEVERITY.CRITICAL, category: CATEGORIES.SEXUAL },
  { term: 'kunnamone', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'kunnappan', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'andi', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'andhi', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'andimone', severity: SEVERITY.HIGH, category: CATEGORIES.SLUR },
  { term: 'thayoli', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'thayolimone', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'thayolii', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'thevidichi', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'vedi', severity: SEVERITY.HIGH, category: CATEGORIES.SLUR },
  { term: 'vedichi', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'veshya', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'oompi', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'oompan', severity: SEVERITY.HIGH, category: CATEGORIES.SLUR },
  { term: 'oomb', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'oomban', severity: SEVERITY.HIGH, category: CATEGORIES.SLUR },
  { term: 'oombikko', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'koothi', severity: SEVERITY.CRITICAL, category: CATEGORIES.SEXUAL },
  { term: 'koothara', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'koothichi', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'naari', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'naariya', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'naariyavan', severity: SEVERITY.MEDIUM, category: CATEGORIES.INSULT },
  { term: 'patti', severity: SEVERITY.LOW, category: CATEGORIES.INSULT },
  { term: 'pattimone', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT },
  { term: 'naayinte mon', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT, is_phrase: true },
  { term: 'naayinte mol', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT, is_phrase: true }
];

const OBFUSCATED_PATTERNS = [
  { term: 'f*ck', normalized_target: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'f**k', normalized_target: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'fuk', normalized_target: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'fack', normalized_target: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'fak', normalized_target: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'f4ck', normalized_target: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'f@ck', normalized_target: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'fck', normalized_target: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'fckr', normalized_target: 'fucker', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'fuq', normalized_target: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'fukk', normalized_target: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'fuuuck', normalized_target: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'f.u.c.k', normalized_target: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'f-u-c-k', normalized_target: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'f u c k', normalized_target: 'fuck', severity: SEVERITY.HIGH, category: CATEGORIES.PROFANITY },
  { term: 'sh1t', normalized_target: 'shit', severity: SEVERITY.MEDIUM, category: CATEGORIES.PROFANITY },
  { term: 'sh!t', normalized_target: 'shit', severity: SEVERITY.MEDIUM, category: CATEGORIES.PROFANITY },
  { term: '$hit', normalized_target: 'shit', severity: SEVERITY.MEDIUM, category: CATEGORIES.PROFANITY },
  { term: '5hit', normalized_target: 'shit', severity: SEVERITY.MEDIUM, category: CATEGORIES.PROFANITY },
  { term: 'b!tch', normalized_target: 'bitch', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT },
  { term: 'b1tch', normalized_target: 'bitch', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT },
  { term: 'btch', normalized_target: 'bitch', severity: SEVERITY.HIGH, category: CATEGORIES.INSULT },
  { term: 'a55', normalized_target: 'ass', severity: SEVERITY.LOW, category: CATEGORIES.PROFANITY },
  { term: '@ss', normalized_target: 'ass', severity: SEVERITY.LOW, category: CATEGORIES.PROFANITY },
  { term: 'a$$', normalized_target: 'ass', severity: SEVERITY.LOW, category: CATEGORIES.PROFANITY },
  { term: 'd1ck', normalized_target: 'dick', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'd!ck', normalized_target: 'dick', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'c0ck', normalized_target: 'cock', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'p*ssy', normalized_target: 'pussy', severity: SEVERITY.HIGH, category: CATEGORIES.SEXUAL },
  { term: 'c*nt', normalized_target: 'cunt', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'wh0re', normalized_target: 'whore', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR },
  { term: 'sl*t', normalized_target: 'slut', severity: SEVERITY.CRITICAL, category: CATEGORIES.SLUR }
];

// Combine all terms into enriched dictionary
const OFFENSIVE_TERMS = {
  english: ENGLISH_TERMS.map(t => ({
    ...t,
    language: 'english',
    enabled: true,
    created_at: new Date().toISOString()
  })),
  malayalam: MALAYALAM_TERMS.map(t => ({
    ...t,
    language: 'malayalam',
    enabled: true,
    created_at: new Date().toISOString()
  })),
  malayalam_transliteration: MALAYALAM_TRANSLITERATION_TERMS.map(t => ({
    ...t,
    language: 'malayalam_transliteration',
    enabled: true,
    created_at: new Date().toISOString()
  })),
  obfuscated: OBFUSCATED_PATTERNS.map(t => ({
    ...t,
    language: 'obfuscated',
    enabled: true,
    created_at: new Date().toISOString()
  }))
};

// Flattened active dictionary list
const ALL_TERMS = [
  ...OFFENSIVE_TERMS.english,
  ...OFFENSIVE_TERMS.malayalam,
  ...OFFENSIVE_TERMS.malayalam_transliteration,
  ...OFFENSIVE_TERMS.obfuscated
];

module.exports = {
  SEVERITY,
  CATEGORIES,
  OFFENSIVE_TERMS,
  ALL_TERMS
};
