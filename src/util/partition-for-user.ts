/**
 * Returns the Electron partition for a given itch.io user
 */
function partitionForUser(userId: string): string {
  return `persist:itchio-${userId || "anonymous"}`;
}

export default partitionForUser;
