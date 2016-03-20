
import {combineReducers} from 'redux'
import login from './login'
import credentials from './credentials'
import navigation from './navigation'

export default combineReducers({
  login,
  credentials,
  navigation
})
