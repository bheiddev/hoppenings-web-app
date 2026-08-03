import { isBlockedWord } from './blockedDisplayNameWords';

const DISALLOWED_MESSAGE = 'This display name contains language that is not allowed. Please choose something else.';

/**
 * Validates a display name against a blocklist of inappropriate terms
 * (profanity, slurs, etc.). Checks whole words and substrings so that
 * obfuscations (e.g. "w0rd", "word123") are still caught.
 *
 * @returns { allowed: true } or { allowed: false, error: string }
 */
export function validateDisplayName(name: string): { allowed: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { allowed: true }; // Empty handled elsewhere
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { allowed: true };
  }

  const lower = trimmed.toLowerCase();

  // Split into tokens: letters/numbers only (so we catch "word" inside "badword123")
  const tokens = lower.split(/\s+/).flatMap((part) => {
    // Also split on non-alphanumeric so "x-y" becomes ["x","y"]
    return part.split(/[^a-z0-9]+/).filter(Boolean);
  });

  for (const token of tokens) {
    if (isBlockedWord(token)) {
      return { allowed: false, error: DISALLOWED_MESSAGE };
    }
  }

  // Check if the full normalized string is a blocked word (e.g. single word name)
  if (isBlockedWord(trimmed)) {
    return { allowed: false, error: DISALLOWED_MESSAGE };
  }

  return { allowed: true };
}
