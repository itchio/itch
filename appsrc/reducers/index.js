
import {combineReducers} from 'redux'

import modals from './modals'
import market from './market'
import system from './system'
import setup from './setup'
import rememberedSessions from './remembered-sessions'
import session from './session'
import i18n from './i18n'
import ui from './ui'

const reducer = combineReducers({
  modals,
  market,
  system,
  setup,
  rememberedSessions,
  session,
  i18n,
  ui
})
export default reducer
