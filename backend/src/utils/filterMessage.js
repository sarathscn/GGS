const { detectOffensiveContent } = require('../moderation/moderationService');

function filterMessage(text) {
  if (!text) return { filteredText: text, isFlagged: false, matches: [] };
  const detection = detectOffensiveContent(text);
  return {
    filteredText: detection.cleanText,
    isFlagged: detection.hasMatches,
    matches: detection.matches,
    severity: detection.severity,
    confidence: detection.confidence
  };
}

module.exports = filterMessage;
