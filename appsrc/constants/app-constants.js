
const keyMirror = require('keymirror')

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

  /* Locale updates */
  LOCALE_UPDATE_DOWNLOADED: null,
  LOCALE_UPDATE_QUEUE_DOWNLOAD: null,
  LOCALE_UPDATE_DOWNLOAD_START: null,
  LOCALE_UPDATE_DOWNLOAD_END: null,

  /* Install locations */
  COMPUTE_INSTALL_LOCATION_SIZE: null,
  CANCEL_INSTALL_LOCATION_SIZE_COMPUTATION: null,
  BROWSE_INSTALL_LOCATION: null,
  ADD_INSTALL_LOCATION_REQUEST: null,
  ADD_INSTALL_LOCATION: null,
  ADD_INSTALL_LOCATIONED: null,
  REMOVE_INSTALL_LOCATION_REQUEST: null,
  REMOVE_INSTALL_LOCATION: null,
  REMOVE_INSTALL_LOCATIOND: null,
  TRANSFER_INSTALL_LOCATION: null,
  MAKE_INSTALL_LOCATION_DEFAULT: null,

  /** User requested game to be uninstalled */
  REQUEST_CAVE_UNINSTALL: null,
  /** Cave is going to be uninstalled */
  QUEUE_CAVE_UNINSTALL: null,
  /** Cave is going to be reinstalled */
  QUEUE_CAVE_REINSTALL: null,
  /** Persistent cave metadata storage needs to be updated */
  UPDATE_CAVE: null,
  /** Should probably replaced with an CaveStore.emit('change') event */
  CAVE_PROGRESS: null,
  /** Kaboom! */
  IMPLODE_CAVE: null,
  /** I changed my mind */
  CANCEL_CAVE: null,
  /** Bye bye. */
  CAVE_THROWN_INTO_BIT_BUCKET: null,
  /** i spy, i spy */
  EXPLORE_CAVE: null,
  /** Alright, what broke this time? */
  PROBE_CAVE: null,
  /** Let the others figure it out */
  REPORT_CAVE: null,
  /** Won't compromise on that */
  SHOW_PACKAGING_POLICY: null,

  /** User requested game to be installed */
  QUEUE_GAME: null,

  /** Open a game's page */
  BROWSE_GAME: null,

  /** Buy / support something! */
  INITIATE_PURCHASE: null,
  PURCHASE_COMPLETED: null,

  /** Set app-wide progress bar (title bar on Windows). Negative value clears. */
  SET_PROGRESS: null,
  /** OSX-only, bounce dock */
  BOUNCE: null,
  /** Cross-platform, notification bubble */
  NOTIFY: null,

  /* Data retrieval */
  FETCH_COLLECTIONS: null,
  FETCH_GAMES: null,
  FETCH_SEARCH: null,
  SEARCH_FETCHED: null,
  GAMES_FETCHED: null,

  /** Data sync functions */
  GAME_STORE_DIFF: null,
  CAVE_STORE_DIFF: null,
  CAVE_STORE_CAVE_DIFF: null,
  INSTALL_LOCATION_STORE_DIFF: null,

  /** Ready but needs human login */
  NO_STORED_CREDENTIALS: null,
  /** Any login attempt (cached or not) */
  ATTEMPT_LOGIN: null,
  /** Private - login attempt with username/password */
  LOGIN_WITH_PASSWORD: null,
  /** Wrong login/password or something else */
  LOGIN_FAILURE: null,
  /** API key available beyond this point */
  AUTHENTICATED: null,
  /** market available beyond this point */
  READY_TO_ROLL: null,
  /** install locations available beyond this point */
  LOCATIONS_READY: null,
  /** Asked to logout */
  CHANGE_USER: null,
  /** Confirmed logout */
  LOGOUT: null,

  /** Sent from metal when needs to eval something in chrome. Example: HTML5 Notification API */
  EVAL: null,

  /** Sent when app is about to reboot or shutdown */
  IMPLODE_APP: null,

  /** Buh-bye */
  QUIT: null,
  QUIT_WHEN_MAIN: null,

  /** Hi again! */
  GAIN_FOCUS: null,

  /** GC unused database entries */
  GC_DATABASE: null,

  /* Preferences */
  OPEN_PREFERENCES: null,
  PREFERENCES_SET_LANGUAGE: null,
  PREFERENCES_SET_SNIFFED_LANGUAGE: null
})
