
import path from 'path'
import os from '../util/os'
import {app, Menu, Tray} from '../electron'

import {takeEvery} from 'redux-saga'
import {call} from 'redux-saga/effects'
import createQueue from './queue'

import {focusWindow, navigate, quit} from '../actions'
import {BOOT} from '../constants/action-types'

let tray

function makeTray (queue) {
  const iconPath = path.resolve(`${__dirname}/../static/images/itchio-tray.png`)
  console.log(`icon path: `, iconPath)
  tray = new Tray(iconPath)
  tray.setToolTip('itch.io')
  tray.on('click', () => queue.dispatch(focusWindow()))
  tray.on('double-click', () => queue.dispatch(focusWindow()))
}

function setMenu (trayMenu, queue) {
  if (os.platform() === 'darwin') {
    app.dock.setMenu(trayMenu)
  } else {
    if (!tray) {
      makeTray(queue)
    }
    tray.setContextMenu(trayMenu)
  }
}

export default function * traySaga () {
  const queue = createQueue('tray')

  function * _refresh () {
    const menuTemplate = [
      {label: 'Owned', click: () => queue.dispatch(navigate('owned'))},
      {label: 'Dashboard', click: () => queue.dispatch(navigate('owned'))}
    ]

    if (os.platform() !== 'darwin') {
      menuTemplate.push({type: 'separator'})
      menuTemplate.push({label: 'Exit', click: () => queue.dispatch(quit())})
    }

    const trayMenu = Menu.buildFromTemplate(menuTemplate)
    yield call(setMenu, trayMenu, queue)
  }

  yield [
    takeEvery(BOOT, _refresh),
    call(queue.exhaust)
  ]
}

export function getTray () {
  return tray
}
