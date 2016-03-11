
import {handleActions} from 'redux-actions'

const initialState = {
  page: 'gate',
  path: 'dashboard'
}

export default handleActions({
  SWITCH_PAGE: (state, action) => {
    const page = action.payload
    return {...state, page}
  },

  NAVIGATE: (state, action) => {
    const path = action.payload
    return {...state, path}
  }
}, initialState)
