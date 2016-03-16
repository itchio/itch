
import {combineReducers} from 'redux'

import market from './market'
import system from './system'
import setup from './setup'
import session from './session'
import i18n from './i18n'
import ui from './ui'

const reducer = combineReducers({
  market,
  system,
  setup,
  session,
  i18n,
  ui
})
export default reducer
