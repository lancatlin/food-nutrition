/**
 * Converts a string to Title Case.
 * Capitalizes the first letter of each word except for common minor words
 * (unless the minor word is the first word).
 *
 * Example:
 * "chicken breast" -> "Chicken Breast"
 * "fish and chips" -> "Fish and Chips"
 */

const minorWords = new Set([
  "and",
  "as",
  "at",
  "but",
  "by",
  "en",
  "for",
  "if",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "v",
  "vs",
  "via",
]);

export function titleCase(str: string): string {
  if (!str) return "";

  return str
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (index > 0 && minorWords.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
