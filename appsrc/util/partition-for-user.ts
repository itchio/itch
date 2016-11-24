
/**
 * Returns the Electron partition for a given itch.io user
 */
export default function partitionForUser (userId: string): string {
  return `persist:itchio-${userId || "anonymous"}`;
}
