
import invariant from 'invariant'
import {omit} from 'underline'
import {handleActions} from 'redux-actions'

const initialState = {}

export default handleActions({
  SESSIONS_REMEMBERED: (state, action) => {
    const sessions = action.payload
    return {...state, ...sessions}
  },

  SESSION_UPDATED: (state, action) => {
    const {userId, record} = action.payload
    const session = state[userId] || {}
    return {...state, [userId]: {...session, ...record}}
  },

  FORGET_SESSION: (state, action) => {
    const userId = action.payload
    invariant(typeof userId !== 'undefined', 'forgetting session from a valid userId')
    const {sessions} = state
    return {...state, sessions: sessions::omit(userId)}
  }
}, initialState)
