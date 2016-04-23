
import {darkMineShaft} from '../constants/colors'
import {app, BrowserWindow} from '../electron'
import config from '../util/config'
import invariant from 'invariant'
import {debounce} from 'underline'

import localizer from '../localizer'
import * as actions from '../actions'

import {
  WINDOW_BOUNDS_CHANGED,
  BOOT,
  FOCUS_WINDOW,
  HIDE_WINDOW,
  CLOSE_TAB_OR_AUX_WINDOW,
  QUIT_WHEN_MAIN,
  QUIT_ELECTRON_APP,
  PREPARE_QUIT,
  QUIT
} from '../constants/action-types'

import {takeEvery} from 'redux-saga'
import {call, fork, put, select} from 'redux-saga/effects'

import createQueue from './queue'

let createLock = false
let quitting = false

const BOUNDS_CONFIG_KEY = 'main_window_bounds'

function * _createWindow () {
  if (createLock) return
  createLock = true

  const userBounds = config.get(BOUNDS_CONFIG_KEY) || {}
  const bounds = {
    x: -1,
    y: -1,
    width: 1250,
    height: 720,
    ...userBounds
  }
  const {width, height} = bounds
  const center = (bounds.x === -1 && bounds.y === -1)

  const window = new BrowserWindow({
    title: app.getName(),
    icon: `./static/images/tray/${app.getName()}.png`,
    width, height,
    center,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: darkMineShaft,
    titleBarStyle: 'hidden',
    'title-bar-style': 'hidden'
  })

  if (!center) {
    window.setPosition(bounds.x, bounds.y)
  }

  const queue = createQueue('main-window')

  let destroyTimeout

  window.on('close', (e) => {
    if (quitting) {
      // alright alright you get to close
      return
    }

    if (!window.isMinimized()) {
      const store = require('../store').default
      let prefs = {}
      if (store) {
        prefs = store.getState().preferences || {}
      }
      if (!prefs.gotMinimizeNotification) {
        queue.dispatch(actions.updatePreferences({
          gotMinimizeNotification: true
        }))

        const i18n = store.getState().i18n
        const t = localizer.getT(i18n.strings, i18n.lang)
        queue.dispatch(actions.notify({
          title: t('notification.see_you_soon.title'),
          body: t('notification.see_you_soon.message')
        }))
      }

      // minimize first to convey the fact that the app still lives
      // in the tray - however, it'll take a lot less RAM because the
      // renderer is actually trashed
      e.preventDefault()
      window.minimize()

      setTimeout(() => {
        if (!window.isDestroyed()) {
          window.hide()
        }
      }, 0.2 * 1000)

      destroyTimeout = setTimeout(() => {
        if (!window.isDestroyed() && !window.isVisible()) {
          window.close()
        }
      }, 10 * 1000)
    }
  })

  window.on('closed', (e) => {
    queue.dispatch(actions.windowDestroyed())
  })

  window.on('focus', (e) => {
    if (destroyTimeout) {
      clearTimeout(destroyTimeout)
      destroyTimeout = null
    }
    queue.dispatch(actions.windowFocusChanged({focused: true}))
  })

  window.on('blur', (e) => {
    queue.dispatch(actions.windowFocusChanged({focused: false}))
  })

  window.on('enter-full-screen', (e) => {
    queue.dispatch(actions.windowFullscreenChanged({fullscreen: true}))
  })

  window.on('leave-full-screen', (e) => {
    queue.dispatch(actions.windowFullscreenChanged({fullscreen: false}))
  })

  const debouncedBounds = (() => {
    if (window.isDestroyed()) {
      return
    }
    const bounds = window.getBounds()
    queue.dispatch(actions.windowBoundsChanged({bounds}))
  })::debounce(2000)

  window.on('move', (e) => {
    debouncedBounds()
  })

  window.on('resize', (e) => {
    debouncedBounds()
  })

  window.webContents.on('dom-ready', (e) => {
    createLock = false
    queue.dispatch(actions.windowReady({id: window.id}))
    window.show()
  })

  const uri = `file://${__dirname}/../index.html`
  window.loadURL(uri)

  if (process.env.DEVTOOLS === '1') {
    window.webContents.openDevTools({detach: true})
  }

  yield* queue.exhaust()
}

export function * _windowBoundsChanged (action) {
  const {bounds} = action.payload
  config.set(BOUNDS_CONFIG_KEY, bounds)
}

export function * _focusWindow () {
  const id = yield select((state) => state.ui.mainWindow.id)

  if (id) {
    const window = BrowserWindow.fromId(id)
    invariant(window, 'window still exists')
    yield call(::window.show)
  } else {
    yield fork(_createWindow)
  }
}

export function * _hideWindow () {
  const window = BrowserWindow.getFocusedWindow()
  if (window) {
    yield call(::window.close)
  }
}

export function * _closeTabOrAuxWindow () {
  const focused = BrowserWindow.getFocusedWindow()
  if (focused) {
    const id = yield select((state) => state.ui.mainWindow.id)
    if (focused.id === id) {
      yield put(actions.closeTab())
    } else {
      yield call(::focused.close)
    }
  }
}

export function * _quitWhenMain () {
  const mainId = yield select((state) => state.ui.mainWindow.id)
  const focused = BrowserWindow.getFocusedWindow()

  if (focused) {
    if (focused.id === mainId) {
      yield put(actions.quit())
    } else {
      yield call(::focused.close)
    }
  }
}

export function * _quitElectronApp () {
  yield call(::app.quit)
}

export function * _prepareQuit () {
  // sigh..
  quitting = true
}

export function * _quit () {
  yield put(actions.prepareQuit())
  yield put(actions.quitElectronApp())
}

export default function * mainWindowSaga () {
  yield [
    takeEvery(WINDOW_BOUNDS_CHANGED, _windowBoundsChanged),
    takeEvery(FOCUS_WINDOW, _focusWindow),
    takeEvery(HIDE_WINDOW, _hideWindow),
    takeEvery(CLOSE_TAB_OR_AUX_WINDOW, _closeTabOrAuxWindow),
    takeEvery(BOOT, _focusWindow),
    takeEvery(QUIT_WHEN_MAIN, _quitWhenMain),
    takeEvery(QUIT_ELECTRON_APP, _quitElectronApp),
    takeEvery(PREPARE_QUIT, _prepareQuit),
    takeEvery(QUIT, _quit)
  ]
}
