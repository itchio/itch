
import {getTray} from './tray'
import {app, BrowserWindow} from '../electron'
import os from '../util/os'

import {takeEvery} from 'redux-saga'
import {select, put} from 'redux-saga/effects'

import {notifyHtml5} from '../actions'
import {SET_PROGRESS, BOUNCE, NOTIFY} from '../constants/action-types'

const DEFAULT_ICON = './static/images/itchio-tray-x4.png'

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
  const {title = 'itch', body, icon = DEFAULT_ICON} = action.payload

  if (os.platform() === 'win32' && !/^10\./.test(os.release())) {
    const tray = getTray()
    if (tray) {
      // The HTML5 notification API has caveats on Windows earlier than 10
      tray.displayBalloon({title, icon, content: body})
    }
  } else {
    const id = yield select(selectMainWindowId)
    const window = BrowserWindow.fromId(id)
    if (window && !window.isDestroyed() && !window.webContents.isDestroyed()) {
      const opts = {body, icon}
      yield put(notifyHtml5({title, opts}))
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
