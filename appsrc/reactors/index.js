
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

export default validateReactors({
  _ALL: combine(i18n, session.catchAll, tray.catchAll),

  PREBOOT: combine(preboot),
  BOOT: combine(market.boot, preferences.boot, mainWindow.focusWindow, locales.boot, rememberedSessions.boot),

  LOGIN_WITH_TOKEN: combine(login.loginWithToken),
  LOGIN_SUCCEEDED: combine(market.loginSucceeded, fetch.loginSucceeded, rememberedSessions.loginSucceeded),
  LOGOUT: combine(market.logout, session.logout),

  SESSION_READY: combine(session.sessionReady, url.sessionReady),

  FORGET_SESSION_REQUEST: combine(rememberedSessions.forgetSessionRequest),
  FORGET_SESSION: combine(rememberedSessions.forgetSession),

  USER_DB_COMMIT: combine(fetch.fetchCollectionGames),

  UPDATE_PREFERENCES: combine(preferences.updatePreferences),

  LANGUAGE_CHANGED: combine(locales.languageChanged),
  QUEUE_LOCALE_DOWNLOAD: combine(locales.queueLocaleDownload),

  WINDOW_BOUNDS_CHANGED: combine(mainWindow.windowBoundsChanged),
  WINDOW_FOCUS_CHANGED: combine(fetch.windowFocusChanged),
  FOCUS_WINDOW: combine(mainWindow.focusWindow),
  HIDE_WINDOW: combine(mainWindow.hideWindow),

  HANDLE_ITCHIO_URL: combine(url.handleItchioUrl),

  PURCHASE_COMPLETED: combine(fetch.purchaseCompleted),

  FETCH_COLLECTION_GAMES: combine(fetch.fetchCollectionGames),

  SEARCH: combine(fetch.search),

  SET_PROGRESS: combine(notifications.setProgress),
  BOUNCE: combine(notifications.bounce),
  NOTIFY: combine(notifications.notify),

  CLOSE_TAB_OR_AUX_WINDOW: combine(mainWindow.closeTabOrAuxWindow),
  QUIT_WHEN_MAIN: combine(mainWindow.quitWhenMain),
  QUIT_ELECTRON_APP: combine(mainWindow.quitElectronApp),
  PREPARE_QUIT: combine(mainWindow.prepareQuit),
  QUIT: combine(mainWindow.quit)
})
