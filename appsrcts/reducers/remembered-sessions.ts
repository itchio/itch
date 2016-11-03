
import invariant from 'invariant'
import {omit} from 'underline'
import {handleActions} from 'redux-actions'

const initialState = {}

export default handleActions({
  SESSIONS_REMEMBERED: (state, action) => {
    const sessions = action.payload
    return sessions
  },

  SESSION_UPDATED: (state, action) => {
    const {id, record} = action.payload
    const session = state[id] || {}
    return {...state, [id]: {...session, ...record}}
  },

  FORGET_SESSION: (state, action) => {
    const {id} = action.payload
    invariant(typeof id !== 'undefined', 'forgetting session from a valid userId')
    return state::omit(id)
  }
}, initialState)
