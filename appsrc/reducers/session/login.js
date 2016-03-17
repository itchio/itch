
import invariant from 'invariant'
import {omit} from 'underline'
import {handleActions} from 'redux-actions'

const initialState = {
  stage: 'pick',
  sessions: {},
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

  SESSIONS_REMEMBERED: (state, action) => {
    const sessions = action.payload
    return {...state, sessions}
  },

  FORGET_SESSION: (state, action) => {
    const userId = action.payload
    invariant(typeof userId !== 'undefined', 'forgetting session from a valid userId')
    const {sessions} = state
    return {...state, sessions: sessions::omit(userId)}
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
