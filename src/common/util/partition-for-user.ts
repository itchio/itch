/**
 * Returns the Electron partition for a given itch.io user
 */
export function partitionForUser(userId: string): string {
  return `persist:itchio-${userId || "anonymous"}`;
}

export function partitionForApp(): string {
  return `persist:itch-app`;
}
