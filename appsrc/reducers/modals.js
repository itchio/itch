
import {handleActions} from 'redux-actions'

const initialState = []

export default handleActions({
  OPEN_MODAL: (state, action) => {
    const modal = action.payload
    return [...state, modal]
  },

  CLOSE_MODAL: (state, action) => {
    return state.slice(1)
  }
}, initialState)
