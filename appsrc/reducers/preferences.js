
import {handleActions} from 'redux-actions'

const initialState = {
  downloadSelfUpdates: true,
  offlineMode: false
}

export default handleActions({
  UPDATE_PREFERENCES: (state, action) => {
    const record = action.payload
    console.log('updating preferences: ', record)

    // TODO: save that
    return {...state, ...record}
  }
}, initialState)
