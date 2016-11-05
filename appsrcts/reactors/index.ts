
import validateReactors from "./validate-reactors";
import combine, {assertAllCombined} from "./combine";

import preboot from "./preboot";
import preferences from "./preferences";
import login from "./login";
import market from "./market";
import mainWindow from "./main-window";
import fetch from "./fetch";
import i18n from "./i18n";
import locales from "./locales";
import rememberedSessions from "./remembered-sessions";
import session from "./session";
import url from "./url";
import tray from "./tray";
import notifications from "./notifications";
import menu from "./menu";
import installLocations from "./install-locations";
import purchases from "./purchases";
import selfUpdate from "./self-update";
import setup from "./setup";
import updater from "./updater";
import tabs from "./tabs";
import triggers from "./triggers";
import contextMenu from "./context-menu";
import share from "./share";
import navigation from "./navigation";
import clipboard from "./clipboard";
import tasks from "./tasks";
import dialogs from "./dialogs";
import report from "./report";
import perf from "./perf";
import modals from "./modals";
import halloween from "./halloween";

export default validateReactors({
  _ALL: combine(i18n.catchAll, session.catchAll, tray.catchAll, menu.catchAll,
    installLocations.catchAll, navigation.catchAll),

  CLOSE_MODAL: combine(modals.closeModal),
  MODAL_CLOSED: combine(modals.modalClosed),

  PREBOOT: combine(preboot.preboot, perf.preboot),
  BOOT: combine(preferences.boot, mainWindow.boot,
    locales.boot, setup.boot,
    tasks.boot, tray.boot, perf.boot, halloween.boot),
  FIRST_WINDOW_READY: combine(market.firstWindowReady, rememberedSessions.firstWindowReady,
    selfUpdate.firstWindowReady),
  WINDOW_READY: combine(navigation.windowReady),
  RETRY_SETUP: combine(setup.retrySetup),

  LOGIN_WITH_TOKEN: combine(login.loginWithToken),
  LOGIN_WITH_PASSWORD: combine(login.loginWithPassword),
  LOGIN_SUCCEEDED: combine(market.loginSucceeded, fetch.loginSucceeded,
    rememberedSessions.loginSucceeded, perf.loginSucceeded),
  LOGOUT: combine(market.logout, session.logout, navigation.logout),
  CHANGE_USER: combine(dialogs.changeUser),

  FIRST_USEFUL_PAGE: combine(perf.firstUsefulPage),

  SESSION_READY: combine(session.sessionReady, url.sessionReady,
    updater.sessionReady, navigation.sessionReady),

  SESSIONS_REMEMBERED: combine(login.sessionsRemembered),
  FORGET_SESSION_REQUEST: combine(rememberedSessions.forgetSessionRequest),
  FORGET_SESSION: combine(rememberedSessions.forgetSession),

  USER_DB_READY: combine(fetch.userDbReady),
  USER_DB_COMMIT: combine(fetch.userDbCommit),

  UPDATE_PREFERENCES: combine(preferences.updatePreferences),

  LANGUAGE_CHANGED: combine(locales.languageChanged),
  QUEUE_LOCALE_DOWNLOAD: combine(locales.queueLocaleDownload),

  WINDOW_BOUNDS_CHANGED: combine(mainWindow.windowBoundsChanged),
  WINDOW_FOCUS_CHANGED: combine(fetch.windowFocusChanged,
    installLocations.windowFocusChanged, navigation.windowFocusChanged),
  FOCUS_WINDOW: combine(mainWindow.focusWindow),
  HIDE_WINDOW: combine(mainWindow.hideWindow),

  NEW_TAB: combine(tabs.newTab),
  FOCUS_NTH_TAB: combine(tabs.focusNthTab),
  SHOW_PREVIOUS_TAB: combine(tabs.showPreviousTab),
  SHOW_NEXT_TAB: combine(tabs.showNextTab),
  TAB_RELOADED: combine(navigation.tabReloaded),
  EVOLVE_TAB: combine(navigation.evolveTab),
  TABS_CHANGED: combine(navigation.tabsChanged),
  TAB_CHANGED: combine(navigation.tabChanged),

  QUEUE_GAME: combine(tasks.queueGame),
  QUEUE_DOWNLOAD: combine(tasks.queueDownload),
  REQUEST_CAVE_UNINSTALL: combine(dialogs.requestCaveUninstall),
  QUEUE_CAVE_REINSTALL: combine(tasks.queueCaveReinstall),
  QUEUE_CAVE_UNINSTALL: combine(tasks.queueCaveUninstall),
  RETRY_DOWNLOAD: combine(tasks.retryDownload),
  DOWNLOAD_ENDED: combine(tasks.downloadEnded),
  TASK_ENDED: combine(installLocations.taskEnded, tasks.taskEnded),
  EXPLORE_CAVE: combine(tasks.exploreCave),
  IMPLODE_CAVE: combine(tasks.implodeCave),
  PROBE_CAVE: combine(navigation.probeCave),
  REPORT_CAVE: combine(report.reportCave),
  ABORT_GAME_REQUEST: combine(dialogs.abortGameRequest),
  ABORT_LAST_GAME: combine(tasks.abortLastGame),
  ABORT_GAME: combine(tasks.abortGame),

  ABORT_TASK: combine(tasks.abortTask),

  TRIGGER_MAIN_ACTION: combine(triggers.triggerMainAction),
  TRIGGER_OK: combine(triggers.triggerOk),
  TRIGGER_BACK: combine(triggers.triggerBack),

  MAKE_INSTALL_LOCATION_DEFAULT: combine(installLocations.makeInstallLocationDefault),
  REMOVE_INSTALL_LOCATION_REQUEST: combine(installLocations.removeInstallLocationRequest),
  REMOVE_INSTALL_LOCATION: combine(installLocations.removeInstallLocation),
  ADD_INSTALL_LOCATION_REQUEST: combine(installLocations.addInstallLocationRequest),
  ADD_INSTALL_LOCATION: combine(installLocations.addInstallLocation),
  BROWSE_INSTALL_LOCATION: combine(installLocations.browseInstallLocation),
  QUERY_FREE_SPACE: combine(installLocations.queryFreeSpace),

  CHECK_FOR_GAME_UPDATES: combine(updater.checkForGameUpdates),
  CHECK_FOR_GAME_UPDATE: combine(updater.checkForGameUpdate),

  OPEN_URL: combine(url.openUrl),
  REPORT_ISSUE: combine(url.reportIssue),
  HANDLE_ITCHIO_URL: combine(url.handleItchioUrl),

  VIEW_CREATOR_PROFILE: combine(url.viewCreatorProfile),
  VIEW_COMMUNITY_PROFILE: combine(url.viewCommunityProfile),

  OPEN_TAB_CONTEXT_MENU: combine(contextMenu.openTabContextMenu),
  COPY_TO_CLIPBOARD: combine(clipboard.copyToClipboard),

  INITIATE_PURCHASE: combine(purchases.initiatePurchase),
  PURCHASE_COMPLETED: combine(fetch.purchaseCompleted),
  INITIATE_SHARE: combine(share.initiateShare),

  FETCH_COLLECTION_GAMES: combine(fetch.fetchCollectionGames),

  SEARCH: combine(fetch.search),

  BOUNCE: combine(notifications.bounce),
  NOTIFY: combine(notifications.notify),
  STATUS_MESSAGE: combine(notifications.statusMessage),

  CHECK_FOR_SELF_UPDATE: combine(selfUpdate.checkForSelfUpdate),
  APPLY_SELF_UPDATE_REQUEST: combine(selfUpdate.applySelfUpdateRequest),
  APPLY_SELF_UPDATE: combine(selfUpdate.applySelfUpdate),
  SELF_UPDATE_ERROR: combine(selfUpdate.selfUpdateError),
  SHOW_AVAILABLE_SELF_UPDATE: combine(selfUpdate.showAvailableSelfUpdate),

  CLEAR_FILTERS: combine(navigation.clearFilters),

  CLOSE_TAB_OR_AUX_WINDOW: combine(mainWindow.closeTabOrAuxWindow),
  QUIT_WHEN_MAIN: combine(mainWindow.quitWhenMain),
  QUIT_ELECTRON_APP: combine(mainWindow.quitElectronApp),
  PREPARE_QUIT: combine(mainWindow.prepareQuit),
  QUIT_AND_INSTALL: combine(mainWindow.quitAndInstall),
  QUIT: combine(mainWindow.quit),
});

assertAllCombined(
  preboot,
  preferences,
  login,
  market,
  mainWindow,
  fetch,
  i18n,
  locales,
  rememberedSessions,
  session,
  url,
  tray,
  notifications,
  menu,
  installLocations,
  purchases,
  selfUpdate,
  setup,
  updater,
  tabs,
  triggers,
  contextMenu,
  share,
  navigation,
  clipboard,
  tasks,
  dialogs,
  report,
  perf,
  modals,
  halloween
);
