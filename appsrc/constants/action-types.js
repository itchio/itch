
import keyMirror from 'keymirror'

// not using 'export default' so each constant is a separate export
module.exports = keyMirror({
  // run upgrade operations
  PREBOOT: null,

  // actually start the app
  BOOT: null,

  // Chromium is good at retrieving the user's language from the innards of the OS
  // doing the same from nodejs would probably be a waste of everyone's time
  LANGUAGE_SNIFFED: null,
  LANGUAGE_CHANGED: null,

  OPEN_MODAL: null,
  CLOSE_MODAL: null,

  SETUP_STATUS: null,
  SETUP_DONE: null,
  RETRY_SETUP: null,

  SESSION_READY: null,
  SESSIONS_REMEMBERED: null,
  SESSION_UPDATED: null,
  FORGET_SESSION_REQUEST: null,
  FORGET_SESSION: null,

  START_ONBOARDING: null,
  EXIT_ONBOARDING: null,

  GLOBAL_DB_COMMIT: null,
  GLOBAL_DB_READY: null,
  GLOBAL_DB_CLOSED: null,

  USER_DB_COMMIT: null,
  USER_DB_READY: null,
  USER_DB_CLOSED: null,

  /* Background stuff */
  DISMISS_HISTORY_ITEM: null,
  QUEUE_HISTORY_ITEM: null,
  HISTORY_READ: null,

  /* Main window events */
  WINDOW_READY: null,
  WINDOW_DESTROYED: null,
  WINDOW_FOCUS_CHANGED: null,
  WINDOW_FULLSCREEN_CHANGED: null,
  WINDOW_BOUNDS_CHANGED: null,
  CREATE_WINDOW: null,
  FOCUS_WINDOW: null,
  HIDE_WINDOW: null,
  CLOSE_TAB_OR_AUX_WINDOW: null,

  /* Navigation */
  NAVIGATE: null,
  FOCUS_NTH_TAB: null,
  MOVE_TAB: null,
  EVOLVE_TAB: null,
  TAB_EVOLVED: null,
  NEW_TAB: null,
  CLOSE_TAB: null,
  SHOW_PREVIOUS_TAB: null,
  SHOW_NEXT_TAB: null,
  SWITCH_PAGE: null,
  OPEN_URL: null,
  TRIGGER_MAIN_ACTION: null,
  TRIGGER_BACK: null,
  TRIGGER_LOCATION: null,

  SHORTCUTS_VISIBILITY_CHANGED: null,
  TOGGLE_MINI_SIDEBAR: null,

  TAB_RELOADED: null,
  TAB_CHANGED: null,
  TABS_CHANGED: null,
  TABS_RESTORED: null,
  TAB_DATA_FETCHED: null,

  OPEN_TAB_CONTEXT_MENU: null,
  UNLOCK_TAB: null,

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
  SHOW_AVAILABLE_SELF_UPDATE: null,
  APPLY_SELF_UPDATE: null,
  APPLY_SELF_UPDATE_REQUEST: null,
  DISMISS_STATUS: null,

  /* Locales */
  LOCALES_CONFIG_LOADED: null,
  QUEUE_LOCALE_DOWNLOAD: null,
  LOCALE_DOWNLOAD_STARTED: null,
  LOCALE_DOWNLOAD_ENDED: null,

  /* Install locations */
  BROWSE_INSTALL_LOCATION: null,
  ADD_INSTALL_LOCATION_REQUEST: null,
  ADD_INSTALL_LOCATION: null,
  REMOVE_INSTALL_LOCATION_REQUEST: null,
  REMOVE_INSTALL_LOCATION: null,
  MAKE_INSTALL_LOCATION_DEFAULT: null,
  QUERY_FREE_SPACE: null,
  FREE_SPACE_UPDATED: null,

  /* Tasks */
  TASK_STARTED: null,
  TASK_PROGRESS: null,
  TASK_ENDED: null,

  /* Downloads */
  DOWNLOAD_STARTED: null,
  DOWNLOAD_PROGRESS: null,
  DOWNLOAD_ENDED: null,

  CLEAR_FINISHED_DOWNLOADS: null,

  PRIORITIZE_DOWNLOAD: null,
  PAUSE_DOWNLOADS: null,
  RESUME_DOWNLOADS: null,
  RETRY_DOWNLOAD: null,

  /** User requested game to be uninstalled */
  REQUEST_CAVE_UNINSTALL: null,
  /** Cave is going to be uninstalled */
  QUEUE_CAVE_UNINSTALL: null,
  /** Cave is going to be reinstalled */
  QUEUE_CAVE_REINSTALL: null,
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

  CHECK_FOR_GAME_UPDATE: null,
  CHECK_FOR_GAME_UPDATES: null,

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

  /** Search */
  FOCUS_SEARCH: null,
  SEARCH_QUERY_CHANGED: null,
  SEARCH: null,
  SEARCH_FETCHED: null,
  SEARCH_STARTED: null,
  SEARCH_FINISHED: null,
  CLOSE_SEARCH: null,

  /** Data retrieval */
  FETCH_COLLECTION_GAMES: null,
  COLLECTION_GAMES_FETCHED: null,

  /** Start picking from a list of remembered sessions */
  LOGIN_START_PICKING: null,
  /** Go back to username/password form to add new login */
  LOGIN_STOP_PICKING: null,

  /** Any login attempt (cached or not) */
  ATTEMPT_LOGIN: null,
  /** Private - login attempt with username/password */
  LOGIN_WITH_PASSWORD: null,
  /** Private - login attempt with stored token */
  LOGIN_WITH_TOKEN: null,
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
  UPDATE_PREFERENCES: null,

  VIEW_CREATOR_PROFILE: null,
  VIEW_COMMUNITY_PROFILE: null
})
