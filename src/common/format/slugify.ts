/**
 * Returns a version of input with only [a-zA-Z_ ] and
 * collapsed whitespace.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-zA-Z_ ]/g, "")
    .replace(/ +/g, "_");
}
