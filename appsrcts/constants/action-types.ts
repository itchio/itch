
export interface ActionType extends String { }

// run upgrade operations
export const PREBOOT: ActionType = "PREBOOT";

// actually start the app
export const BOOT: ActionType = "BOOT";
export const FIRST_USEFUL_PAGE: ActionType = "FIRST_USEFUL_PAGE";

// Chromium is good at retrieving the user's language from the innards of the OS
// doing the same from nodejs would probably be a waste of everyone's time
export const LANGUAGE_SNIFFED: ActionType = "LANGUAGE_SNIFFED";
export const LANGUAGE_CHANGED: ActionType = "LANGUAGE_CHANGED";

export const OPEN_MODAL: ActionType = "OPEN_MODAL";
export const CLOSE_MODAL: ActionType = "CLOSE_MODAL";
export const MODAL_CLOSED: ActionType = "MODAL_CLOSED";
export const MODAL_RESPONSE: ActionType = "MODAL_RESPONSE";

export const SETUP_STATUS: ActionType = "SETUP_STATUS";
export const SETUP_DONE: ActionType = "SETUP_DONE";
export const RETRY_SETUP: ActionType = "RETRY_SETUP";

export const SESSION_READY: ActionType = "SESSION_READY";
export const SESSIONS_REMEMBERED: ActionType = "SESSIONS_REMEMBERED";
export const SESSION_UPDATED: ActionType = "SESSION_UPDATED";
export const FORGET_SESSION_REQUEST: ActionType = "FORGET_SESSION_REQUEST";
export const FORGET_SESSION: ActionType = "FORGET_SESSION";

export const START_ONBOARDING: ActionType = "START_ONBOARDING";
export const EXIT_ONBOARDING: ActionType = "EXIT_ONBOARDING";

export const GLOBAL_DB_COMMIT: ActionType = "GLOBAL_DB_COMMIT";
export const GLOBAL_DB_READY: ActionType = "GLOBAL_DB_READY";
export const GLOBAL_DB_CLOSED: ActionType = "GLOBAL_DB_CLOSED";

export const USER_DB_COMMIT: ActionType = "USER_DB_COMMIT";
export const USER_DB_READY: ActionType = "USER_DB_READY";
export const USER_DB_CLOSED: ActionType = "USER_DB_CLOSED";

/* Background stuff */
export const DISMISS_HISTORY_ITEM: ActionType = "DISMISS_HISTORY_ITEM";
export const QUEUE_HISTORY_ITEM: ActionType = "QUEUE_HISTORY_ITEM";
export const HISTORY_READ: ActionType = "HISTORY_READ";

/* Main window events */
export const FIRST_WINDOW_READY: ActionType = "FIRST_WINDOW_READY";
export const WINDOW_READY: ActionType = "WINDOW_READY";
export const WINDOW_DESTROYED: ActionType = "WINDOW_DESTROYED";
export const WINDOW_FOCUS_CHANGED: ActionType = "WINDOW_FOCUS_CHANGED";
export const WINDOW_FULLSCREEN_CHANGED: ActionType = "WINDOW_FULLSCREEN_CHANGED";
export const WINDOW_BOUNDS_CHANGED: ActionType = "WINDOW_BOUNDS_CHANGED";
export const CREATE_WINDOW: ActionType = "CREATE_WINDOW";
export const FOCUS_WINDOW: ActionType = "FOCUS_WINDOW";
export const HIDE_WINDOW: ActionType = "HIDE_WINDOW";
export const CLOSE_TAB_OR_AUX_WINDOW: ActionType = "CLOSE_TAB_OR_AUX_WINDOW";
export const CLOSE_ALL_TABS: ActionType = "CLOSE_ALL_TABS";

/* Navigation */
export const NAVIGATE: ActionType = "NAVIGATE";
export const FOCUS_NTH_TAB: ActionType = "FOCUS_NTH_TAB";
export const MOVE_TAB: ActionType = "MOVE_TAB";
export const EVOLVE_TAB: ActionType = "EVOLVE_TAB";
export const TAB_EVOLVED: ActionType = "TAB_EVOLVED";
export const NEW_TAB: ActionType = "NEW_TAB";
export const CLOSE_TAB: ActionType = "CLOSE_TAB";
export const SHOW_PREVIOUS_TAB: ActionType = "SHOW_PREVIOUS_TAB";
export const SHOW_NEXT_TAB: ActionType = "SHOW_NEXT_TAB";
export const SWITCH_PAGE: ActionType = "SWITCH_PAGE";
export const OPEN_URL: ActionType = "OPEN_URL";
export const REPORT_ISSUE: ActionType = "REPORT_ISSUE";
export const COPY_TO_CLIPBOARD: ActionType = "COPY_TO_CLIPBOARD";
export const HANDLE_ITCHIO_URL: ActionType = "HANDLE_ITCHIO_URL";
export const TRIGGER_MAIN_ACTION: ActionType = "TRIGGER_MAIN_ACTION";
export const TRIGGER_OK: ActionType = "TRIGGER_OK";
export const TRIGGER_BACK: ActionType = "TRIGGER_BACK";
export const TRIGGER_LOCATION: ActionType = "TRIGGER_LOCATION";

export const SHORTCUTS_VISIBILITY_CHANGED: ActionType = "SHORTCUTS_VISIBILITY_CHANGED";
export const TOGGLE_MINI_SIDEBAR: ActionType = "TOGGLE_MINI_SIDEBAR";

export const TAB_RELOADED: ActionType = "TAB_RELOADED";
export const TAB_CHANGED: ActionType = "TAB_CHANGED";
export const TABS_CHANGED: ActionType = "TABS_CHANGED";
export const TABS_RESTORED: ActionType = "TABS_RESTORED";
export const TAB_DATA_FETCHED: ActionType = "TAB_DATA_FETCHED";

export const OPEN_TAB_CONTEXT_MENU: ActionType = "OPEN_TAB_CONTEXT_MENU";
export const UNLOCK_TAB: ActionType = "UNLOCK_TAB";

/* Menu */
export const REFRESH_MENU: ActionType = "REFRESH_MENU";

/** Buh-bye */
export const PREPARE_QUIT: ActionType = "PREPARE_QUIT";
export const QUIT: ActionType = "QUIT";
export const QUIT_WHEN_MAIN: ActionType = "QUIT_WHEN_MAIN";
export const QUIT_ELECTRON_APP: ActionType = "QUIT_ELECTRON_APP";
export const QUIT_AND_INSTALL: ActionType = "QUIT_AND_INSTALL";

/* Self updates */
export const CHECK_FOR_SELF_UPDATE: ActionType = "CHECK_FOR_SELF_UPDATE";
export const CHECKING_FOR_SELF_UPDATE: ActionType = "CHECKING_FOR_SELF_UPDATE";
export const SELF_UPDATE_AVAILABLE: ActionType = "SELF_UPDATE_AVAILABLE";
export const SELF_UPDATE_NOT_AVAILABLE: ActionType = "SELF_UPDATE_NOT_AVAILABLE";
export const SELF_UPDATE_ERROR: ActionType = "SELF_UPDATE_ERROR";
export const SELF_UPDATE_DOWNLOADED: ActionType = "SELF_UPDATE_DOWNLOADED";
export const SHOW_AVAILABLE_SELF_UPDATE: ActionType = "SHOW_AVAILABLE_SELF_UPDATE";
export const APPLY_SELF_UPDATE: ActionType = "APPLY_SELF_UPDATE";
export const APPLY_SELF_UPDATE_REQUEST: ActionType = "APPLY_SELF_UPDATE_REQUEST";
export const DISMISS_STATUS: ActionType = "DISMISS_STATUS";

export const STATUS_MESSAGE: ActionType = "STATUS_MESSAGE";
export const DISMISS_STATUS_MESSAGE: ActionType = "DISMISS_STATUS_MESSAGE";

/* Locales */
export const LOCALES_CONFIG_LOADED: ActionType = "LOCALES_CONFIG_LOADED";
export const QUEUE_LOCALE_DOWNLOAD: ActionType = "QUEUE_LOCALE_DOWNLOAD";
export const LOCALE_DOWNLOAD_STARTED: ActionType = "LOCALE_DOWNLOAD_STARTED";
export const LOCALE_DOWNLOAD_ENDED: ActionType = "LOCALE_DOWNLOAD_ENDED";

/* Install locations */
export const BROWSE_INSTALL_LOCATION: ActionType = "BROWSE_INSTALL_LOCATION";
export const ADD_INSTALL_LOCATION_REQUEST: ActionType = "ADD_INSTALL_LOCATION_REQUEST";
export const ADD_INSTALL_LOCATION: ActionType = "ADD_INSTALL_LOCATION";
export const REMOVE_INSTALL_LOCATION_REQUEST: ActionType = "REMOVE_INSTALL_LOCATION_REQUEST";
export const REMOVE_INSTALL_LOCATION: ActionType = "REMOVE_INSTALL_LOCATION";
export const MAKE_INSTALL_LOCATION_DEFAULT: ActionType = "MAKE_INSTALL_LOCATION_DEFAULT";
export const QUERY_FREE_SPACE: ActionType = "QUERY_FREE_SPACE";
export const FREE_SPACE_UPDATED: ActionType = "FREE_SPACE_UPDATED";

/* Tasks */
export const TASK_STARTED: ActionType = "TASK_STARTED";
export const TASK_PROGRESS: ActionType = "TASK_PROGRESS";
export const TASK_ENDED: ActionType = "TASK_ENDED";

export const ABORT_TASK: ActionType = "ABORT_TASK";

/* Downloads */
export const QUEUE_DOWNLOAD: ActionType = "QUEUE_DOWNLOAD";
export const DOWNLOAD_STARTED: ActionType = "DOWNLOAD_STARTED";
export const DOWNLOAD_PROGRESS: ActionType = "DOWNLOAD_PROGRESS";
export const DOWNLOAD_ENDED: ActionType = "DOWNLOAD_ENDED";

export const CLEAR_FINISHED_DOWNLOADS: ActionType = "CLEAR_FINISHED_DOWNLOADS";

export const PRIORITIZE_DOWNLOAD: ActionType = "PRIORITIZE_DOWNLOAD";
export const CANCEL_DOWNLOAD: ActionType = "CANCEL_DOWNLOAD";
export const PAUSE_DOWNLOADS: ActionType = "PAUSE_DOWNLOADS";
export const RESUME_DOWNLOADS: ActionType = "RESUME_DOWNLOADS";
export const RETRY_DOWNLOAD: ActionType = "RETRY_DOWNLOAD";
export const CLEAR_GAME_DOWNLOADS: ActionType = "CLEAR_GAME_DOWNLOADS";

export const DOWNLOAD_SPEED_DATAPOINT: ActionType = "DOWNLOAD_SPEED_DATAPOINT";

/** User requested game to be uninstalled */
export const REQUEST_CAVE_UNINSTALL: ActionType = "REQUEST_CAVE_UNINSTALL";
/** Cave is going to be uninstalled */
export const QUEUE_CAVE_UNINSTALL: ActionType = "QUEUE_CAVE_UNINSTALL";
/** Cave is going to be reinstalled */
export const QUEUE_CAVE_REINSTALL: ActionType = "QUEUE_CAVE_REINSTALL";
/** Kaboom! */
export const IMPLODE_CAVE: ActionType = "IMPLODE_CAVE";
/** I changed my mind */
export const CANCEL_CAVE: ActionType = "CANCEL_CAVE";
/** Bye bye. */
export const CAVE_THROWN_INTO_BIT_BUCKET: ActionType = "CAVE_THROWN_INTO_BIT_BUCKET";
/** i spy, i spy */
export const EXPLORE_CAVE: ActionType = "EXPLORE_CAVE";
/** Alright, what broke this time? */
export const PROBE_CAVE: ActionType = "PROBE_CAVE";
/** Let the others figure it out */
export const REPORT_CAVE: ActionType = "REPORT_CAVE";
/** Won't compromise on that */
export const SHOW_PACKAGING_POLICY: ActionType = "SHOW_PACKAGING_POLICY";
/** A game has been interacted with! */
export const RECORD_GAME_INTERACTION: ActionType = "RECORD_GAME_INTERACTION";

export const ABORT_GAME_REQUEST: ActionType = "ABORT_GAME_REQUEST";
export const ABORT_LAST_GAME: ActionType = "ABORT_LAST_GAME";
export const ABORT_GAME: ActionType = "ABORT_GAME";

export const CHECK_FOR_GAME_UPDATE: ActionType = "CHECK_FOR_GAME_UPDATE";
export const CHECK_FOR_GAME_UPDATES: ActionType = "CHECK_FOR_GAME_UPDATES";

/** User requested game to be installed */
export const QUEUE_GAME: ActionType = "QUEUE_GAME";

/** Open a game's page */
export const BROWSE_GAME: ActionType = "BROWSE_GAME";

/** Buy / support something! */
export const INITIATE_PURCHASE: ActionType = "INITIATE_PURCHASE";
export const PURCHASE_COMPLETED: ActionType = "PURCHASE_COMPLETED";
export const ENCOURAGE_GENEROSITY: ActionType = "ENCOURAGE_GENEROSITY";

export const INITIATE_SHARE: ActionType = "INITIATE_SHARE";

/** macOS-only, bounce dock */
export const BOUNCE: ActionType = "BOUNCE";
/** Cross-platform, notification bubble */
export const NOTIFY: ActionType = "NOTIFY";
export const NOTIFY_HTML5: ActionType = "NOTIFY_HTML5";

/** Search */
export const FOCUS_SEARCH: ActionType = "FOCUS_SEARCH";
export const FOCUS_FILTER: ActionType = "FOCUS_FILTER";
export const CLEAR_FILTERS: ActionType = "CLEAR_FILTERS";
export const SEARCH_QUERY_CHANGED: ActionType = "SEARCH_QUERY_CHANGED";
export const SEARCH: ActionType = "SEARCH";
export const SEARCH_FETCHED: ActionType = "SEARCH_FETCHED";
export const SEARCH_STARTED: ActionType = "SEARCH_STARTED";
export const SEARCH_FINISHED: ActionType = "SEARCH_FINISHED";
export const CLOSE_SEARCH: ActionType = "CLOSE_SEARCH";
export const SEARCH_HIGHLIGHT_OFFSET: ActionType = "SEARCH_HIGHLIGHT_OFFSET";

export const FILTER_CHANGED: ActionType = "FILTER_CHANGED";
export const BINARY_FILTER_CHANGED: ActionType = "BINARY_FILTER_CHANGED";

/** Data retrieval */
export const FETCH_COLLECTION_GAMES: ActionType = "FETCH_COLLECTION_GAMES";
export const COLLECTION_GAMES_FETCHED: ActionType = "COLLECTION_GAMES_FETCHED";

/** Start picking from a list of remembered sessions */
export const LOGIN_START_PICKING: ActionType = "LOGIN_START_PICKING";
/** Go back to username/password form to add new login */
export const LOGIN_STOP_PICKING: ActionType = "LOGIN_STOP_PICKING";

/** Any login attempt (cached or not) */
export const ATTEMPT_LOGIN: ActionType = "ATTEMPT_LOGIN";
/** Private - login attempt with username/password */
export const LOGIN_WITH_PASSWORD: ActionType = "LOGIN_WITH_PASSWORD";
/** Private - login attempt with stored token */
export const LOGIN_WITH_TOKEN: ActionType = "LOGIN_WITH_TOKEN";
/** Wrong login/password or something else */
export const LOGIN_FAILED: ActionType = "LOGIN_FAILED";
/** API key available beyond this point */
export const LOGIN_SUCCEEDED: ActionType = "LOGIN_SUCCEEDED";
/** market available beyond this point */
export const READY_TO_ROLL: ActionType = "READY_TO_ROLL";
/** install locations available beyond this point */
export const LOCATIONS_READY: ActionType = "LOCATIONS_READY";
/** Asked to log out */
export const CHANGE_USER: ActionType = "CHANGE_USER";
/** Confirmed log out */
export const LOGOUT: ActionType = "LOGOUT";

/** Sent from metal when needs to eval something in chrome. Example: HTML5 Notification API */
export const EVAL: ActionType = "EVAL";

/** Sent when app is about to reboot or shutdown */
export const IMPLODE_APP: ActionType = "IMPLODE_APP";

/** GC unused database entries */
export const GC_DATABASE: ActionType = "GC_DATABASE";

/* Preferences */
export const OPEN_PREFERENCES: ActionType = "OPEN_PREFERENCES";
export const PREFERENCES_SET_LANGUAGE: ActionType = "PREFERENCES_SET_LANGUAGE";
export const UPDATE_PREFERENCES: ActionType = "UPDATE_PREFERENCES";

export const VIEW_CREATOR_PROFILE: ActionType = "VIEW_CREATOR_PROFILE";
export const VIEW_COMMUNITY_PROFILE: ActionType = "VIEW_CREATOR_PROFILE";
