
import {combineReducers} from 'redux'
import login from './login'
import credentials from './credentials'
import navigation from './navigation'
import search from './search'

export default combineReducers({
  login,
  credentials,
  navigation,
  search
})
