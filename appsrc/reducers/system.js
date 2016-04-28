
import os from '../util/os'
import {app} from '../electron'
import {handleActions} from 'redux-actions'

import invariant from 'invariant'

const initialState = {
  appVersion: app.getVersion(),
  osx: (os.platform() === 'darwin'),
  windows: (os.platform() === 'win32'),
  linux: (os.platform() === 'linux'),
  sniffedLanguage: null,
  homePath: app.getPath('home'),
  userDataPath: app.getPath('userData'),
  diskInfo: {}
}

export default handleActions({
  LANGUAGE_SNIFFED: (state, action) => {
    const sniffedLanguage = action.payload
    return {...state, sniffedLanguage}
  },

  FREE_SPACE_UPDATED: (state, action) => {
    const {diskInfo} = action.payload
    invariant(typeof diskInfo === 'object', 'diskInfo results is an object')

    return {...state, diskInfo}
  }
}, initialState)
