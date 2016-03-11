
import {handleActions} from 'redux-actions'

const initialState = {
  done: false,
  errors: [],
  blockingOperation: null
}

export default handleActions({
  SETUP_STATUS: (state, action) => {
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
