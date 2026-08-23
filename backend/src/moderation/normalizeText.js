/**
 * Multilingual Moderation Normalization Pipeline
 * 
 * Generates normalized text representations for robust matching against:
 * - Obfuscated / symbol-substituted English & Malayalam terms
 * - Spaced / punctuated / repeated characters
 * - Unicode homoglyphs and zero-width confusables
 * - Malayalam chillu / diacritic variations
 * - Malayalam transliteration phonetic variants (Manglish)
 */

// Cyrillic & Greek homoglyphs to Latin equivalents
const HOMOGLYPH_MAP = {
  // Cyrillic lowercase
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh',
  'з': 'z', 'и': 'i', 'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
  'о': 'o', 'п': 'p', 'р': 'r', 'с': 'c', 'т': 't', 'у': 'y', 'ф': 'f',
  'х': 'x', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y',
  'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'і': 'i', 'ї': 'i', 'є': 'e',
  // Cyrillic uppercase
  'А': 'a', 'В': 'b', 'Е': 'e', 'К': 'k', 'М': 'm', 'Н': 'h', 'О': 'o',
  'Р': 'p', 'С': 'c', 'Т': 't', 'У': 'y', 'Х': 'x',
  // Greek
  'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'h',
  'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x',
  'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'τ': 't', 'υ': 'u', 'φ': 'f',
  'χ': 'x', 'ψ': 'ps', 'ω': 'o'
};

// Common Leetspeak / Symbol Substitutions
const LEETSPEAK_MAP = {
  '@': 'a', '4': 'a', '^': 'a',
  '$': 's', '5': 's', '§': 's',
  '!': 'i', '1': 'i', '|': 'i', 'l': 'l',
  '0': 'o', '()': 'o', '[]': 'o', '{}': 'o',
  '3': 'e', '€': 'e',
  '7': 't', '+': 't',
  '8': 'b', '8=': 'b',
  'vv': 'w', '\\/\\/': 'w',
  'ph': 'f'
};

// Zero-width and invisible character regex
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u00AD\u2060\u200E\u200F\u180E]/g;

// Strip zero-width characters and normalize Unicode
function cleanUnicode(text) {
  if (!text || typeof text !== 'string') return '';
  return text.normalize('NFKC').replace(ZERO_WIDTH_REGEX, '');
}

// Replace homoglyphs
function replaceHomoglyphs(text) {
  let result = '';
  for (const char of text) {
    result += HOMOGLYPH_MAP[char] || char;
  }
  return result;
}

// Replace symbols / leetspeak with standard Latin
function replaceLeetspeak(text) {
  let result = text.toLowerCase();
  
  // Replace compound symbols first
  result = result.replace(/\(\)/g, 'o').replace(/\[\]/g, 'o').replace(/\{\}/g, 'o');
  result = result.replace(/\\\/\\\//g, 'w');

  let transformed = '';
  for (const char of result) {
    transformed += LEETSPEAK_MAP[char] || char;
  }
  return transformed;
}

// Compress repeated characters (e.g. "fuuuuuck" -> "fuck", "shiiiit" -> "shit", "poooori" -> "poori")
function compressRepeatedChars(text) {
  return text.replace(/(.)\1{2,}/gi, '$1');
}

function compressRepeatedCharsDouble(text) {
  return text.replace(/(.)\1{2,}/gi, '$1$1');
}

// Normalize spaced or punctuated obfuscations (e.g. "f.u.c.k", "f-u-c-k", "f u c k" -> "fuck")
function stripObfuscationSeparators(text) {
  return text
    .replace(/(?<=\b[a-zA-Z])[\s.*+_\-/~`\\!@#$%^&=]+(?=[a-zA-Z]\b)/g, '')
    .replace(/(?<=[a-zA-Z])[\s.*+_\-/~`\\!@#$%^&=]+(?=[a-zA-Z])/g, '');
}

// Malayalam Native Script Normalization (chillu, virama, diacritics)
function normalizeMalayalamScript(text) {
  if (!text) return '';
  let result = cleanUnicode(text);
  
  result = result
    .replace(/\u0D23\u0D4D\u200D/g, '\u0D7A')
    .replace(/\u0D28\u0D4D\u200D/g, '\u0D7B')
    .replace(/\u0D30\u0D4D\u200D/g, '\u0D7C')
    .replace(/\u0D32\u0D4D\u200D/g, '\u0D7D')
    .replace(/\u0D33\u0D4D\u200D/g, '\u0D7E')
    .replace(/\u0D15\u0D4D\u200D/g, '\u0D7F');

  result = result.replace(/[\u200C\u200D]/g, '');
  return result;
}

// Phonetic / Transliteration Normalization for Manglish
function normalizeManglishPhonetics(text) {
  if (!text) return '';
  let result = text.toLowerCase();
  
  // Normalize repeated vowel clusters
  result = result.replace(/oo+/g, 'u').replace(/ee+/g, 'i').replace(/aa+/g, 'a');
  
  // "th" -> "t" for phonetic root matching
  result = result.replace(/th/g, 't');
  
  // "ai" / "ay" / "y" variations in roots like "mair" / "myr" / "mayir"
  result = result.replace(/ay/g, 'y').replace(/ai/g, 'y');

  return result;
}

/**
 * Master Normalization Pipeline
 */
function normalizeText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      raw: '',
      cleaned: '',
      standard: '',
      condensed: '',
      compact: '',
      phonetic: '',
      malayalam: ''
    };
  }

  const cleaned = cleanUnicode(rawText.trim());
  const lower = cleaned.toLowerCase();
  const homoglyphsFixed = replaceHomoglyphs(lower);
  const leetResolved = replaceLeetspeak(homoglyphsFixed);
  const repeatedCompressed = compressRepeatedChars(leetResolved);
  const repeatedDouble = compressRepeatedCharsDouble(leetResolved);
  
  // Standard word-separated view
  const standard = repeatedCompressed.replace(/[\s\t\n\r]+/g, ' ');
  
  // Condensed: strip internal obfuscation characters between letters
  const condensed = stripObfuscationSeparators(repeatedCompressed);
  const condensedDouble = stripObfuscationSeparators(repeatedDouble);
  
  // Letters only before leetspeak substitution (to catch trailing/leading numbers like "myre123", "fuck99")
  const baseAlphaOnly = homoglyphsFixed.replace(/[^a-zA-Z\u0D00-\u0D7F]+/g, ' ').trim();
  const baseAlphaOnlyPhonetic = normalizeManglishPhonetics(compressRepeatedCharsDouble(baseAlphaOnly));

  // Letters only after leetspeak substitution (strips non-letter symbols to catch e.g. "b!tch123")
  const lettersOnly = leetResolved.replace(/[^a-zA-Z\u0D00-\u0D7F]+/g, ' ').trim();
  const lettersOnlyPhonetic = normalizeManglishPhonetics(compressRepeatedCharsDouble(lettersOnly));

  // Compact: purely alphanumeric (for catching heavily separated tokens like "f u c k")
  const compact = leetResolved.replace(/[^a-zA-Z0-9\u0D00-\u0D7F]/g, '');
  
  // Phonetic variant for transliterations
  const phonetic = normalizeManglishPhonetics(repeatedDouble);
  
  // Malayalam script normalized
  const malayalam = normalizeMalayalamScript(cleaned);

  return {
    raw: rawText,
    cleaned,
    standard,
    condensed,
    condensedDouble,
    compact,
    baseAlphaOnly,
    baseAlphaOnlyPhonetic,
    lettersOnly,
    lettersOnlyPhonetic,
    phonetic,
    malayalam
  };
}

module.exports = {
  normalizeText,
  cleanUnicode,
  replaceHomoglyphs,
  replaceLeetspeak,
  compressRepeatedChars,
  normalizeMalayalamScript,
  normalizeManglishPhonetics
};
