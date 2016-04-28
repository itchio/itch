
import os from '../util/os'
import {app} from '../electron'
import {handleActions} from 'redux-actions'

const initialState = {
  appVersion: app.getVersion(),
  osx: (os.platform() === 'darwin'),
  windows: (os.platform() === 'win32'),
  linux: (os.platform() === 'linux'),
  sniffedLanguage: null,
  homePath: app.getPath('home')
}

export default handleActions({
  LANGUAGE_SNIFFED: (state, action) => {
    const sniffedLanguage = action.payload
    return {...state, sniffedLanguage}
  }
}, initialState)
