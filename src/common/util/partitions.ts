/**
 * Returns the Electron partition for a given itch.io user
 */
export function partitionForUser(userId: number): string {
  return `persist:itchio-${userId}`;
}

export function partitionForApp(): string {
  return `persist:itch-app`;
}
