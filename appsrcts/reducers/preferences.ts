
import {handleActions} from 'redux-actions'
import invariant from 'invariant'

const OFFLINE_MODE = process.env.OFFLINE_MODE === '1'

const initialState = {
  downloadSelfUpdates: true,
  offlineMode: OFFLINE_MODE,
  installLocations: {},
  defaultInstallLocation: 'appdata',
  sidebarWidth: 240,
  isolateApps: false,
  closeToTray: true,
  showAdvanced: false
}

export default handleActions({
  UPDATE_PREFERENCES: (state, action) => {
    const record = action.payload
    invariant(typeof record === 'object', 'prefs must be an object')

    return {...state, ...record}
  }
}, initialState)
