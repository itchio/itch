
import {
  focusWindow,
  windowReady,
  windowFocusChanged,
  quit,
  quitElectronApp,
  prepareQuit
} from '../actions'

import {loop, Effects} from 'redux-loop'
import {app, BrowserWindow} from '../electron'
import {handleActions} from 'redux-actions'
import invariant from 'invariant'

const initialState = {
  id: null,
  quitting: false,
  focused: false
}

export const mainWindow = handleActions({
  BOOT: (state, action) => {
    return loop(state, Effects.constant(focusWindow()))
  },

  WINDOW_READY: (state, action) => {
    const {id} = action.payload
    return {...state, id, focused: true}
  },

  FOCUS_WINDOW: (state, action) => {
    const {id} = state

    if (id) {
      const win = BrowserWindow.fromId(id)
      invariant(win, 'main window still exists')
      win.focus()
      return state
    } else {
      createWindow()
      return state
    }
  },

  HIDE_WINDOW: (state, action) => {
    const {id} = state
    const win = BrowserWindow.fromId(id)
    invariant(win, 'main window still exists')
    win.hide()
  },

  QUIT_WHEN_MAIN: (state, action) => {
    const focused = BrowserWindow.getFocusedWindow()
    if (focused) {
      if (focused.id === state.main_window_id) {
        return loop(state, Effects.constant(quit()))
      } else {
        focused.close()
      }
    }
  },

  PREPARE_QUIT: (state, action) => {
    return {...state, quitting: true}
  },

  QUIT: (state, action) => {
    return loop(state, Effects.batch([
      Effects.constant(prepareQuit()),
      Effects.constant(quitElectronApp())
    ]))
  },

  QUIT_ELECTRON_APP: (state, action) => {
    app.quit()
  },

  WINDOW_FOCUS_CHANGED: (state, action) => {
    const {focused} = action.payload
    return {...state, focused}
  }
}, initialState)

function createWindow () {
  const store = require('../store').default
  const width = 1220
  const height = 720

  const window = new BrowserWindow({
    title: 'itch',
    icon: './static/images/itchio-tray-x4.png',
    width, height,
    center: true,
    show: false,
    'title-bar-style': 'hidden'
  })

  window.on('close', (e) => {
    const {quitting} = store.getState().mainWindow
    if (quitting) {
      // let normal electron app shutdown take place
      return
    } else {
      // prevent normal electron app shutdown, just hide window instead
      e.preventDefault()
      window.hide()
      store.dispatch(windowFocusChanged({focused: false}))
    }
  })

  window.on('focus', (e) => {
    store.dispatch(windowFocusChanged({focused: true}))
  })

  window.webContents.on('dom-ready', (e) => {
    store.dispatch(windowReady({id: window.id}))
    window.show()
  })

  const uri = `file://${__dirname}/../index.html`
  window.loadURL(uri)

  if (process.env.DEVTOOLS === '1') {
    window.webContents.openDevTools({detach: true})
  }
}

export default mainWindow
