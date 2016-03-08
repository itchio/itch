
import {combineReducers} from 'redux-loop'

import setup from './setup'
import session from './session'
import i18n from './i18n'
import ui from './ui'

const reducer = combineReducers({
  setup,
  session,
  i18n,
  ui
})
export default reducer
