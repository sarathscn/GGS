const { BLOCKED_WORDS } = require('./constants');

function filterMessage(text) {
  if (!text) return { filteredText: text, isFlagged: false };
  const lowerText = text.toLowerCase();
  let isFlagged = false;
  let filteredText = text;

  for (const word of BLOCKED_WORDS) {
    if (lowerText.includes(word)) {
      isFlagged = true;
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    }
  }

  return { filteredText, isFlagged };
}

module.exports = filterMessage;
