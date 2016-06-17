
import validateReactors from './validate-reactors'
import combine from './combine'

import preboot from './preboot'
import preferences from './preferences'
import login from './login'
import market from './market'
import mainWindow from './main-window'
import fetch from './fetch'
import i18n from './i18n'
import locales from './locales'
import rememberedSessions from './remembered-sessions'
import session from './session'
import url from './url'
import tray from './tray'
import notifications from './notifications'
import menu from './menu'
import installLocations from './install-locations'
import purchases from './purchases'
import selfUpdate from './self-update'
import setup from './setup'
import updater from './updater'
import tabs from './tabs'
import triggers from './triggers'
import contextMenu from './context-menu'
import share from './share'
import navigation from './navigation'
import clipboard from './clipboard'
import tasks from './tasks'
import dialogs from './dialogs'

export default validateReactors({
  _ALL: combine(i18n, session.catchAll, tray.catchAll, menu.catchAll, installLocations.catchAll),

  PREBOOT: combine(preboot),
  BOOT: combine(market.boot, preferences.boot, mainWindow.boot,
    locales.boot, rememberedSessions.boot, selfUpdate.boot, setup.boot,
    navigation.boot, tasks.boot),
  RETRY_SETUP: combine(setup.retrySetup),

  LOGIN_WITH_TOKEN: combine(login.loginWithToken),
  LOGIN_WITH_PASSWORD: combine(login.loginWithPassword),
  LOGIN_SUCCEEDED: combine(market.loginSucceeded, fetch.loginSucceeded, rememberedSessions.loginSucceeded),
  LOGOUT: combine(market.logout, session.logout),
  CHANGE_USER: combine(dialogs.changeUser),

  SESSION_READY: combine(session.sessionReady, url.sessionReady,
    updater.sessionReady, navigation.sessionReady),

  FORGET_SESSION_REQUEST: combine(rememberedSessions.forgetSessionRequest),
  FORGET_SESSION: combine(rememberedSessions.forgetSession),

  USER_DB_READY: combine(fetch.userDbReady),
  USER_DB_COMMIT: combine(fetch.userDbCommit),

  UPDATE_PREFERENCES: combine(preferences.updatePreferences),

  LANGUAGE_CHANGED: combine(locales.languageChanged),
  QUEUE_LOCALE_DOWNLOAD: combine(locales.queueLocaleDownload),

  WINDOW_BOUNDS_CHANGED: combine(mainWindow.windowBoundsChanged),
  WINDOW_FOCUS_CHANGED: combine(fetch.windowFocusChanged, installLocations.windowFocusChanged, navigation.windowFocusChanged),
  FOCUS_WINDOW: combine(mainWindow.focusWindow),
  HIDE_WINDOW: combine(mainWindow.hideWindow),

  NEW_TAB: combine(tabs.newTab),
  FOCUS_NTH_TAB: combine(tabs.focusNthTab),
  SHOW_PREVIOUS_TAB: combine(tabs.showPreviousTab),
  SHOW_NEXT_TAB: combine(tabs.showNextTab),
  TAB_RELOADED: combine(navigation.tabReloaded),
  EVOLVE_TAB: combine(navigation.evolveTab),

  QUEUE_GAME: combine(tasks.queueGame),
  REQUEST_CAVE_UNINSTALL: combine(dialogs.requestCaveUninstall),
  QUEUE_CAVE_REINSTALL: combine(tasks.queueCaveReinstall),
  QUEUE_CAVE_UNINSTALL: combine(tasks.queueCaveUninstall),
  DOWNLOAD_ENDED: combine(tasks.downloadEnded),
  TASK_ENDED: combine(installLocations.taskEnded, tasks.taskEnded),
  EXPLORE_CAVE: combine(tasks.exploreCave),
  IMPLODE_CAVE: combine(tasks.implodeCave),
  PROBE_CAVE: combine(navigation.probeCave),

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

  MENU_ACTION: combine(menu.menuAction),

  OPEN_URL: combine(url.openUrl),
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

  SET_PROGRESS: combine(notifications.setProgress),
  BOUNCE: combine(notifications.bounce),
  NOTIFY: combine(notifications.notify),
  STATUS_MESSAGE: combine(notifications.statusMessage),

  CHECK_FOR_SELF_UPDATE: combine(selfUpdate.checkForSelfUpdate),
  APPLY_SELF_UPDATE_REQUEST: combine(selfUpdate.applySelfUpdateRequest),
  APPLY_SELF_UPDATE: combine(selfUpdate.applySelfUpdate),
  SELF_UPDATE_ERROR: combine(selfUpdate.selfUpdateError),
  SHOW_AVAILABLE_SELF_UPDATE: combine(selfUpdate.showAvailableSelfUpdate),

  CLOSE_TAB_OR_AUX_WINDOW: combine(mainWindow.closeTabOrAuxWindow),
  QUIT_WHEN_MAIN: combine(mainWindow.quitWhenMain),
  QUIT_ELECTRON_APP: combine(mainWindow.quitElectronApp),
  PREPARE_QUIT: combine(mainWindow.prepareQuit),
  QUIT: combine(mainWindow.quit)
})
