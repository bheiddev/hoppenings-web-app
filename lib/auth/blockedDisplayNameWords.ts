/**
 * Blocklist for display names (profanity, slurs, and other inappropriate terms).
 * All entries must be lowercase; validation is case-insensitive.
 *
 * Add all terms you want to block. You can merge in words from an npm package
 * (e.g. bad-words) or a curated list, then add custom terms. Use addBlockedWords()
 * at app startup if you load a list from remote config.
 * Keep this in sync with any server-side validation if you add it later.
 */
const BLOCKED_WORDS: readonly string[] = [
  // Replace and expand with your full list (profanity, slurs, etc.).
  // Example placeholders:
  'badword',
  'blocked',
  'inappropriate',
];

const blockedSet = new Set(BLOCKED_WORDS);

export function isBlockedWord(word: string): boolean {
  if (!word || typeof word !== 'string') return false;
  const normalized = word.toLowerCase().trim();
  if (!normalized) return false;
  return blockedSet.has(normalized);
}

export function getBlockedWords(): ReadonlySet<string> {
  return blockedSet;
}

/**
 * Add more words at runtime if needed (e.g. loaded from remote config).
 * This mutates the internal set; new words persist for the app session.
 */
export function addBlockedWords(words: string[]): void {
  words.forEach((w) => {
    const n = w?.toLowerCase?.()?.trim();
    if (n) blockedSet.add(n);
  });
}
