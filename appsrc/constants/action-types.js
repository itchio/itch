
import keyMirror from 'keymirror'

// not using 'export default' so each constant is a separate export
module.exports = keyMirror({
  BOOT: null,
  OPEN_URL: null,

  // Chromium is good at retrieving the user's language from the innards of the OS
  // doing the same from nodejs would probably be a waste of everyone's time
  LANGUAGE_SNIFFED: null,
  LANGUAGE_SET: null,

  SETUP_STATUS: null,
  SETUP_DONE: null,

  SESSION_READY: null,

  /* Background stuff */
  OPERATION_FAILED: null,

  /* Main window events */
  WINDOW_READY: null,
  WINDOW_DESTROYED: null,
  WINDOW_FOCUS_CHANGED: null,
  WINDOW_BOUNDS_CHANGED: null,
  CREATE_WINDOW: null,
  FOCUS_WINDOW: null,
  HIDE_WINDOW: null,

  /* Navigation */
  NAVIGATE: null,
  SWITCH_PAGE: null,

  /* Menu */
  REFRESH_MENU: null,
  MENU_ACTION: null,

  /** Buh-bye */
  PREPARE_QUIT: null,
  QUIT: null,
  QUIT_WHEN_MAIN: null,
  QUIT_ELECTRON_APP: null,

  /** Issues */
  REPORT_ISSUE: null,

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

  /* Locales */
  LOCALES_CONFIG_LOADED: null,
  QUEUE_LOCALE_DOWNLOAD: null,
  LOCALE_DOWNLOAD_STARTED: null,
  LOCALE_DOWNLOAD_ENDED: null,

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
  /** A game has been interacted with! */
  RECORD_GAME_INTERACTION: null,

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
  NOTIFY_HTML5: null,

  /* Data retrieval */
  FETCH_COLLECTIONS: null,
  FETCH_GAMES: null,
  FETCH_SEARCH: null,

  SEARCH_FETCHED: null,
  CLOSE_SEARCH: null,

  /** Data sync functions */
  GAME_STORE_DIFF: null,
  CAVE_STORE_DIFF: null,
  CAVE_STORE_CAVE_DIFF: null,
  INSTALL_LOCATION_STORE_DIFF: null,

  /** Any login attempt (cached or not) */
  ATTEMPT_LOGIN: null,
  /** Private - login attempt with username/password */
  LOGIN_WITH_PASSWORD: null,
  /** Wrong login/password or something else */
  LOGIN_FAILED: null,
  /** API key available beyond this point */
  LOGIN_SUCCEEDED: null,
  /** market available beyond this point */
  READY_TO_ROLL: null,
  /** install locations available beyond this point */
  LOCATIONS_READY: null,
  /** Asked to log out */
  CHANGE_USER: null,
  /** Confirmed log out */
  LOGOUT: null,

  /** Sent from metal when needs to eval something in chrome. Example: HTML5 Notification API */
  EVAL: null,

  /** Sent when app is about to reboot or shutdown */
  IMPLODE_APP: null,

  /** GC unused database entries */
  GC_DATABASE: null,

  /* Preferences */
  OPEN_PREFERENCES: null,
  PREFERENCES_SET_LANGUAGE: null,
  PREFERENCES_SET_SNIFFED_LANGUAGE: null
})
