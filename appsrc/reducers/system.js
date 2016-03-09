
import os from '../util/os'
import {app} from '../electron'
import {handleActions} from 'redux-actions'

const initialState = {
  appVersion: app.getVersion(),
  osx: (os.platform() === 'darwin'),
  windows: (os.platform() === 'win32'),
  linux: (os.platform() === 'linux')
}

export default handleActions({}, initialState)
