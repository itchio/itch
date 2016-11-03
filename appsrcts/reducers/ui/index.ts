
import {combineReducers} from 'redux'

import mainWindow from './main-window'
import menu from './menu'
import tray from './tray'

export default combineReducers({
  mainWindow,
  menu,
  tray
})
