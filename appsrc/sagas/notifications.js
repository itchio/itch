
import {getTray} from './tray'
import {app, BrowserWindow} from '../electron'
import os from '../util/os'

import {select} from 'redux-saga/effects'
import {takeEvery} from 'redux-saga'
import {SET_PROGRESS, BOUNCE, NOTIFY} from '../constants/action-types'

const selectMainWindowId = (state) => state.ui.mainWindow.id

function * _setProgress (action) {
  const alpha = action.payload
  const id = yield select(selectMainWindowId)
  const window = BrowserWindow.fromId(id)
  if (window) {
    window.setProgressBar(alpha)
  }
}

function * _bounce (action) {
  const dock = {app}
  if (dock) {
    dock.bounce()
  }
}

function * _notify (action) {
  const {message} = action.payload

  if (os.platform() === 'win32') {
    const id = yield select(selectMainWindowId)
    const window = BrowserWindow.fromId(id)
    if (window) {
      // using stringify as an escape mechanism
      window.webContents.executeJavaScript(`new Notification(${JSON.stringify(message)})`)
    }
  } else {
    const tray = getTray()
    if (tray) {
      // HTML5 notification API not implemented in electron on win32 yet -- amos
      tray.displayBalloon({title: 'itch.io', content: message})
    }
  }
}

export default function * notificationsSaga () {
  yield [
    takeEvery(SET_PROGRESS, _setProgress),
    takeEvery(BOUNCE, _bounce),
    takeEvery(NOTIFY, _notify)
  ]
}
