
import validateReactors from './validate-reactors'
import combine from './combine'

import preboot from './preboot'
import preferences from './preferences'
import login from './login'
import market from './market'
import mainWindow from './main-window'

export default validateReactors({
  PREBOOT: combine(preboot),
  BOOT: combine(market.boot, preferences.boot, mainWindow.focusWindow),

  LOGIN_WITH_TOKEN: combine(login.loginWithToken),
  LOGIN_SUCCEEDED: combine(market.loginSucceeded),
  LOGOUT: combine(market.logout),

  UPDATE_PREFERENCES: combine(preferences.updatePreferences),

  WINDOW_BOUNDS_CHANGED: combine(mainWindow.windowBoundsChanged),
  FOCUS_WINDOW: combine(mainWindow.focusWindow),
  HIDE_WINDOW: combine(mainWindow.hideWindow),

  CLOSE_TAB_OR_AUX_WINDOW: combine(mainWindow.closeTabOrAuxWindow),
  QUIT_WHEN_MAIN: combine(mainWindow.quitWhenMain),
  QUIT_ELECTRON_APP: combine(mainWindow.quitElectronApp),
  PREPARE_QUIT: combine(mainWindow.prepareQuit),
  QUIT: combine(mainWindow.quit)
})
