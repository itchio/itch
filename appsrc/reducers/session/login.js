
import invariant from 'invariant'
import {omit} from 'underline'
import {handleActions} from 'redux-actions'

const initialState = {
  picking: true,
  sessions: {},
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

  LOGIN_FAILED: (state, action) => {
    const {errors} = action.payload
    return {...initialState, errors, blockingOperation: null}
  },

  LOGIN_SUCCEDED: (state, action) => {
    const {sessions} = state
    return {...initialState, sessions}
  },

  LOGOUT: (state, action) => {
    const {sessions} = state
    return {...initialState, sessions}
  }
}, initialState)
