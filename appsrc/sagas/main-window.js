
import {BrowserWindow} from '../electron'
import {EventEmitter} from 'events'
import invariant from 'invariant'

import {
  windowReady,
  windowDestroyed,
  windowFocusChanged,
  quit
} from '../actions'

import {
  BOOT,
  PREPARE_QUIT,
  FOCUS_WINDOW,
  HIDE_WINDOW,
  WINDOW_DESTROYED,
  QUIT_WHEN_MAIN
} from '../constants/action-types'

import {takeEvery} from 'redux-saga'
import {call, put, select} from 'redux-saga/effects'

function * createWindow () {
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

  const windowActions = new EventEmitter()
  const actions = []

  const pumpAction = () => new Promise((resolve, reject) => {
    windowActions.once('action', resolve)
  })

  window.on('close', (e) => {
    windowActions.emit('action', windowDestroyed())
  })

  window.on('focus', (e) => {
    windowActions.emit('action', windowFocusChanged({focused: true}))
  })

  window.on('blur', (e) => {
    windowActions.emit('action', windowFocusChanged({focused: false}))
  })

  window.webContents.on('dom-ready', (e) => {
    windowActions.emit('action', windowReady({id: window.id}))
    window.show()
  })

  const uri = `file://${__dirname}/../index.html`
  window.loadURL(uri)

  if (process.env.DEVTOOLS === '1') {
    window.webContents.openDevTools({detach: true})
  }

  windowActions.on('action', (action) => {
    actions.push(action)
  })

  while (true) {
    yield call(pumpAction)
    while (actions.length > 0) {
      const action = actions.shift()
      yield put(action)

      if (action.type === WINDOW_DESTROYED) {
        return
      }
    }
  }
}

export function * focusWindow () {
  const id = yield select((state) => state.ui.mainWindow.id)

  if (id) {
    const window = BrowserWindow.fromId(id)
    invariant(window, 'window still exists')
    yield call(::window.show)
  } else {
    yield* createWindow()
  }
}

export function * hideWindow () {
  const id = yield select((state) => state.ui.mainWindow.id)

  if (id) {
    const window = BrowserWindow.fromId(id)
    invariant(window, 'window still exists')
    yield call(::window.close)
  }
}

export function * quitWhenMain () {
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

export default function * mainSaga () {
  yield [
    takeEvery(FOCUS_WINDOW, focusWindow),
    takeEvery(HIDE_WINDOW, hideWindow),
    takeEvery(BOOT, focusWindow),
    takeEvery(QUIT_WHEN_MAIN, quitWhenMain)
  ]
}
