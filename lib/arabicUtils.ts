/** Returns the Arabic word for "lesson" in singular, dual, or plural form. */
export function lessonWord(n: number): string {
  if (n === 2) return "درسان";
  if (n >= 3 && n <= 10) return "دروس";
  return "درس";
}
