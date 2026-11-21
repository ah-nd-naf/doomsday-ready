/**
 * Generates a clean URL/filename slug from a movie title.
 * Lowercase, removes punctuation (colons, dots, asterisks), spaces become hyphens.
 * e.g. "Captain America: Civil War" -> "captain-america-civil-war"
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:.!?,'"()*]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
