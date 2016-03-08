
import {handleActions} from 'redux-actions'

const initialState = {
  id: null,
  focused: false
}

export const mainWindow = handleActions({
  WINDOW_READY: (state, action) => {
    const {id} = action.payload
    return {...state, id, focused: true}
  },

  WINDOW_DESTROYED: (state, action) => {
    return {...state, id: null, focused: false}
  },

  PREPARE_QUIT: (state, action) => {
    return {...state, quitting: true}
  },

  WINDOW_FOCUS_CHANGED: (state, action) => {
    const {focused} = action.payload
    return {...state, focused}
  }
}, initialState)

export default mainWindow
