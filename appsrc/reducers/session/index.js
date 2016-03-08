
import {combineReducers} from 'redux-loop'
import credentials from './credentials'
import navigation from './navigation'
import preferences from './preferences'

export default combineReducers({
  credentials,
  navigation,
  preferences
})
