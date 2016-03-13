
import {handleActions} from 'redux-actions'

const initialState = {
  errors: [],
  blockingOperation: null
}

export default handleActions({
  ATTEMPT_LOGIN: (state, action) => {
    return {
      errors: [],
      blockingOperation: {
        icon: 'heart-filled',
        message: ['login.status.login']
      }
    }
  },

  LOGIN_SUCCEDED: (state, action) => {
    return initialState
  },

  LOGIN_FAILED: (state, action) => {
    const errors = action.payload
    return {...initialState, errors, blockingOperation: null}
  },

  LOGOUT: (state, action) => {
    return initialState
  }
}, initialState)
