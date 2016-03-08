
import {BrowserWindow} from '../electron'
import {EventEmitter} from 'events'
import invariant from 'invariant'

import {
  windowReady,
  windowFocusChanged
} from '../actions'

import {
  PREPARE_QUIT,
  FOCUS_WINDOW
} from '../constants/action-types'

import {takeEvery} from 'redux-saga'
import {call, put, select} from 'redux-saga/effects'

let quitting = false

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
    if (quitting) {
      console.log(`actually quitting`)
      // let normal electron app shutdown take place
      return
    } else {
      console.log(`not quitting, just hiding!`)
      // prevent normal electron app shutdown, just hide window instead
      e.preventDefault()
      window.hide()
      return false
    }
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
      console.log(`putting action: `, action)
      yield put(action)
    }
  }
}

function * prepareQuit () {
  quitting = true
}

function * focusWindow () {
  const id = yield select((state) => state.ui.mainWindow.id)

  if (id === null) {
    yield* createWindow()
  } else {
    const window = BrowserWindow.fromId(id)
    invariant(window, 'window still exists')
    yield call(::window.show)
  }
}

export default function * mainSaga () {
  console.log(`in mainSaga!`)
  yield [
    takeEvery(PREPARE_QUIT, prepareQuit),
    takeEvery(FOCUS_WINDOW, focusWindow)
  ]
}
