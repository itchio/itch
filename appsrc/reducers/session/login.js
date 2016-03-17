
import {handleActions} from 'redux-actions'

const initialState = {
  picking: true,
  errors: [],
  blockingOperation: null
}

export default handleActions({
  ATTEMPT_LOGIN: (state, action) => {
    return {
      ...state,
      errors: [],
      blockingOperation: {
        icon: 'heart-filled',
        message: ['login.status.login']
      }
    }
  },

  LOGIN_START_PICKING: (state, action) => {
    return {...state, picking: true}
  },

  LOGIN_STOP_PICKING: (state, action) => {
    return {...state, picking: false}
  },

  LOGIN_FAILED: (state, action) => {
    const {errors} = action.payload
    return {...initialState, errors, blockingOperation: null}
  },

  LOGIN_SUCCEEDED: (state, action) => {
    return initialState
  },

  LOGOUT: (state, action) => {
    return initialState
  }
}, initialState)
