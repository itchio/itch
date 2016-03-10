
import {handleActions} from 'redux-actions'

const initialState = {
  errors: [],
  blockingOperation: null
}

export default handleActions({
  SETUP_STATUS: (state, action) => {
    return {
      errors: [],
      blockingOperation: action.payload
    }
  },

  SETUP_DONE: (state, action) => {
    return {
      errors: [],
      blockingOperation: null
    }
  }
}, initialState)
