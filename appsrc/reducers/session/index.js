
import {combineReducers} from 'redux'
import login from './login'
import credentials from './credentials'
import navigation from './navigation'
import preferences from './preferences'

export default combineReducers({
  login,
  credentials,
  navigation,
  preferences
})
