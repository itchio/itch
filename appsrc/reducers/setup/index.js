
import {handleActions} from 'redux-actions'

const initialState = {
  errors: [],
  blockingOperation: null
}

export default handleActions({
  SETUP_STATUS: (state, action) => {
    console.log(`in setup status, got payload: `, action.payload)
    return {
      ...state,
      errors: [],
      blockingOperation: action.payload
    }
  },

  SETUP_DONE: (state, action) => {
    return {
      ...state,
      done: true,
      errors: [],
      blockingOperation: null
    }
  }
}, initialState)
