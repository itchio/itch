
import {app, BrowserWindow} from '../../electron'

import {
  focusWindow,
  quit,
  quitElectronApp,
  prepareQuit
} from '../../actions'

import {loop, Effects} from 'redux-loop'
import {handleActions} from 'redux-actions'
import invariant from 'invariant'

const initialState = {
  id: null,
  focused: false
}

export const mainWindow = handleActions({
  BOOT: (state, action) => {
    console.log(`hey we're in boot how about we focus a window or some shit`)
    return loop(state, Effects.constant(focusWindow()))
  },

  WINDOW_READY: (state, action) => {
    const {id} = action.payload
    return {...state, id, focused: true}
  },

  HIDE_WINDOW: (state, action) => {
    const {id} = state
    const win = BrowserWindow.fromId(id)
    invariant(win, 'main window still exists')
    win.hide()

    return state
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
