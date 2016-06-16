
import validateReactors from './validate-reactors'
import combine from './combine'

import preboot from './preboot'
import login from './login'
import market from './market'

export default validateReactors({
  PREBOOT: combine(preboot),

  LOGIN_WITH_TOKEN: combine(login.loginWithToken),
  LOGIN_SUCCEEDED: combine(market.loginSucceeded),
  LOGOUT: combine(market.logout),

  BOOT: combine(market.boot)
})
