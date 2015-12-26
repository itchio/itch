
let keyMirror = require('keymirror')

module.exports = keyMirror({
  BOOT: null,
  OPEN_URL: null,
  WINDOW_READY: null,
  SETUP_STATUS: null,
  SETUP_WAIT: null,
  SETUP_DONE: null,

  FOCUS_WINDOW: null,
  HIDE_WINDOW: null,
  LIBRARY_FOCUS_PANEL: null,

  /* Self updates */
  CHECK_FOR_SELF_UPDATE: null,
  CHECKING_FOR_SELF_UPDATE: null,
  SELF_UPDATE_AVAILABLE: null,
  SELF_UPDATE_NOT_AVAILABLE: null,
  SELF_UPDATE_ERROR: null,
  SELF_UPDATE_DOWNLOADED: null,
  APPLY_SELF_UPDATE: null,
  APPLY_SELF_UPDATE_FOR_REALSIES: null,
  DISMISS_STATUS: null,

  /* Install locations */
  INSTALL_LOCATION_COMPUTE_SIZE: null,
  INSTALL_LOCATION_BROWSE: null,
  INSTALL_LOCATION_ADD_REQUEST: null,
  INSTALL_LOCATION_ADD: null,
  INSTALL_LOCATION_ADDED: null,
  INSTALL_LOCATION_REMOVE_REQUEST: null,
  INSTALL_LOCATION_REMOVE: null,
  INSTALL_LOCATION_REMOVED: null,
  INSTALL_LOCATION_TRANSFER: null,
  INSTALL_LOCATION_MAKE_DEFAULT: null,

  /** User requested game to be installed */
  CAVE_QUEUE: null,
  /** User requested game to be uninstalled */
  CAVE_QUEUE_UNINSTALL: null,
  /** Internal cave DB needs to be updated */
  CAVE_UPDATE: null,
  /** Should probably replaced with an CaveStore.emit('change') event */
  CAVE_PROGRESS: null,
  /** Kaboom! */
  CAVE_IMPLODE: null,
  /** Bye bye. */
  CAVE_THROWN_INTO_BIT_BUCKET: null,
  /** i spy, i spy */
  CAVE_EXPLORE: null,
  /** Alright, what broke this time? */
  CAVE_PROBE: null,
  /** Let the others figure it out */
  CAVE_REPORT: null,

  /** Open a game's page */
  GAME_BROWSE: null,
  /** Buy / support a game! */
  GAME_PURCHASE: null,
  GAME_PURCHASED: null,

  /** Set app-wide progress bar (title bar on Windows). Negative value clears. */
  SET_PROGRESS: null,
  /** OSX-only, bounce dock */
  BOUNCE: null,
  /** Cross-platform, notification bubble */
  NOTIFY: null,

  /* Data retrieval stuff */
  FETCH_COLLECTIONS: null,
  FETCH_GAMES: null,
  GAMES_FETCHED: null,

  /** Data sync functions */
  GAME_STORE_DIFF: null,

  /** Ready but needs human login */
  NO_STORED_CREDENTIALS: null,
  /** Any login attempt (cached or not) */
  LOGIN_ATTEMPT: null,
  /** Private - login attempt with username/password */
  LOGIN_WITH_PASSWORD: null,
  /** Wrong login/password or something else */
  LOGIN_FAILURE: null,
  /** API key available beyond this point */
  AUTHENTICATED: null,
  /** db available beyond this point */
  READY_TO_ROLL: null,
  /** Asked to logout */
  CHANGE_USER: null,
  /** Confirmed logout */
  LOGOUT: null,

  /** Sent from metal when needs to eval something in chrome. Example: HTML5 Notification API */
  EVAL: null,

  /** Sent when app is about to reboot or shutdown */
  APP_IMPLODE: null,

  /** Buh-bye */
  QUIT: null,

  /** Hi again! */
  GAIN_FOCUS: null,

  /* Preferences */
  OPEN_PREFERENCES: null,
  PREFERENCES_SET_LANGUAGE: null
})
