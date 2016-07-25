
import {handleActions} from 'redux-actions'

import {reject} from 'underline'

const initialState = []

export default handleActions({
  OPEN_MODAL: (state, action) => {
    const modal = action.payload
    return [...state, modal]
  },

  MODAL_CLOSED: (state, action) => {
    const {id} = action.payload
    return state::reject((x) => x.id === id)
  }
}, initialState)
