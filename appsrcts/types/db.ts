
/**
 * Contains information about a game, retrieved via the itch.io API,
 * and saved to the local database.
 */
export interface GameRecord {
  /** Only present for HTML5 games, otherwise null */
  embed?: GameEmbedInfo
}

/**
 * Presentation information for HTML5 games
 */
export interface GameEmbedInfo {
  width: number
  height: number

  // for itch.io website, whether or not a fullscreen button should be shown
  fullscreen: boolean
}
