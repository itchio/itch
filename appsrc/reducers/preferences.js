
import {handleActions} from 'redux-actions'

const OFFLINE_MODE = process.env.OFFLINE_MODE === '1'

const initialState = {
  downloadSelfUpdates: true,
  offlineMode: OFFLINE_MODE,
  installLocations: {},
  defaultInstallLocation: 'appdata'
}

export default handleActions({
  UPDATE_PREFERENCES: (state, action) => {
    const record = action.payload
    console.log('updating preferences: ', record)

    // TODO: save that, in a state watcher
    return {...state, ...record}
  }
}, initialState)
