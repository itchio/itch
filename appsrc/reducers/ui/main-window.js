
import {app, BrowserWindow} from '../../electron'

import {
  quit,
  quitElectronApp,
  prepareQuit
} from '../../actions'

import {loop, Effects} from 'redux-loop'
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

  QUIT_WHEN_MAIN: (state, action) => {
    const {id} = state
    const focused = BrowserWindow.getFocusedWindow()
    if (focused) {
      if (focused.id === id) {
        return loop(state, Effects.constant(quit()))
      } else {
        focused.close()
        return state
      }
    }
  },

  QUIT: (state, action) => {
    return loop(state, Effects.batch([
      Effects.constant(prepareQuit()),
      Effects.constant(quitElectronApp())
    ]))
  },

  QUIT_ELECTRON_APP: (state, action) => {
    setImmediate(::app.quit)
    return state
  },

  WINDOW_FOCUS_CHANGED: (state, action) => {
    const {focused} = action.payload
    return {...state, focused}
  }
}, initialState)

export default mainWindow
