/**
 * Utility functions for formatting text
 */

/**
 * Capitalizes the first letter of a word
 * @param word - The word to capitalize
 * @returns The word with the first letter capitalized
 */
export function capitalizeWord(word: string): string {
  if (!word || word.length === 0) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Capitalizes the first letter of each word in a sentence
 * @param sentence - The sentence to capitalize
 * @returns The sentence with each word's first letter capitalized
 */
export function capitalizeSentence(sentence: string): string {
  if (!sentence || sentence.length === 0) return sentence;
  return sentence
    .split(' ')
    .map(word => capitalizeWord(word))
    .join(' ');
}

/**
 * Formats a word for display (capitalizes first letter)
 * @param word - The word to format
 * @returns The formatted word
 */
export function formatWordForDisplay(word: string): string {
  return capitalizeWord(word);
}

/**
 * Formats a translation for display (capitalizes first letter)
 * @param translation - The translation to format
 * @returns The formatted translation
 */
export function formatTranslationForDisplay(translation: string): string {
  return capitalizeWord(translation);
}
