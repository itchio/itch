
import {app, BrowserWindow} from '../electron'
import invariant from 'invariant'

import {
  prepareQuit,
  quitElectronApp,
  windowReady,
  windowDestroyed,
  windowFocusChanged,
  quit
} from '../actions'

import {
  BOOT,
  FOCUS_WINDOW,
  HIDE_WINDOW,
  QUIT_WHEN_MAIN,
  QUIT_ELECTRON_APP,
  QUIT
} from '../constants/action-types'

import {takeEvery} from 'redux-saga'
import {call, fork, put, select} from 'redux-saga/effects'

import createQueue from './queue'

function * _createWindow () {
  const width = 1220
  const height = 720

  const window = new BrowserWindow({
    title: 'itch',
    icon: './static/images/itchio-tray-x4.png',
    width, height,
    center: true,
    show: false,
    autoHideMenuBar: true,
    'title-bar-style': 'hidden'
  })

  const queue = createQueue('main-window')

  window.on('close', (e) => {
    queue.dispatch(windowDestroyed())
  })

  window.on('focus', (e) => {
    queue.dispatch(windowFocusChanged({focused: true}))
  })

  window.on('blur', (e) => {
    queue.dispatch(windowFocusChanged({focused: false}))
  })

  window.webContents.on('dom-ready', (e) => {
    queue.dispatch(windowReady({id: window.id}))
    window.show()
  })

  const uri = `file://${__dirname}/../index.html`
  window.loadURL(uri)

  if (process.env.DEVTOOLS === '1') {
    window.webContents.openDevTools({detach: true})
  }

  yield* queue.exhaust()
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
  const id = yield select((state) => state.ui.mainWindow.id)

  if (id) {
    const window = BrowserWindow.fromId(id)
    invariant(window, 'window still exists')
    yield call(::window.close)
  }
}

export function * _quitWhenMain () {
  const mainId = yield select((state) => state.ui.mainWindow.id)
  const focused = BrowserWindow.getFocusedWindow()

  if (focused) {
    if (focused.id === mainId) {
      yield put(quit())
    } else {
      yield call(::focused.close)
    }
  }
}

export function * _quitElectronApp () {
  yield call(::app.quit)
}

export function * _quit () {
  yield put(prepareQuit())
  yield put(quitElectronApp())
}

export default function * mainWindowSaga () {
  yield [
    takeEvery(FOCUS_WINDOW, _focusWindow),
    takeEvery(HIDE_WINDOW, _hideWindow),
    takeEvery(BOOT, _focusWindow),
    takeEvery(QUIT_WHEN_MAIN, _quitWhenMain),
    takeEvery(QUIT_ELECTRON_APP, _quitElectronApp),
    takeEvery(QUIT, _quit)
  ]
}
