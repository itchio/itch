
import validateReactors from './validate-reactors'
import combine from './combine'

import preboot from './preboot'
import preferences from './preferences'
import login from './login'
import market from './market'

export default validateReactors({
  PREBOOT: combine(preboot),
  BOOT: combine(market.boot, preferences.boot),

  LOGIN_WITH_TOKEN: combine(login.loginWithToken),
  LOGIN_SUCCEEDED: combine(market.loginSucceeded),
  LOGOUT: combine(market.logout),

  UPDATE_PREFERENCES: combine(preferences.updatePreferences)
})
