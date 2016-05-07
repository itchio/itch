
import path from 'path'
import os from '../util/os'
import localizer from '../localizer'
import {app, Menu, Tray} from '../electron'

import {createSelector} from 'reselect'

import {takeEvery} from './effects'
import {call, select, fork} from 'redux-saga/effects'
import createQueue from './queue'

import {focusWindow, navigate, quit} from '../actions'

let tray

function makeTray (queue) {
  // cf. https://github.com/itchio/itch/issues/462
  // windows still displays a 16x16, whereas
  // some linux DEs don't know what to do with a @x2, etc.
  const iconName = os.platform() === 'linux' ? `${app.getName()}.png` : `${app.getName()}-small.png`
  const iconPath = path.resolve(`${__dirname}/../static/images/tray/${iconName}`)
  tray = new Tray(iconPath)
  tray.setToolTip('itch.io')
  tray.on('click', () => queue.dispatch(focusWindow({toggle: true})))
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

  // TODO: make the tray a lot more useful? that'd be good.
  // (like: make it display recent stuff / maybe the last few tabs)

  const go = (path) => {
    queue.dispatch(focusWindow())
    queue.dispatch(navigate(path))
  }

  function refreshTray (i18n) {
    const t = localizer.getT(i18n.strings, i18n.lang)
    const menuTemplate = [
      {label: t('sidebar.owned'), click: () => go('library')},
      {label: t('sidebar.dashboard'), click: () => go('dashboard')}
    ]

    if (os.platform() !== 'darwin') {
      menuTemplate.push({type: 'separator'})
      menuTemplate.push({label: t('menu.file.quit'), click: () => queue.dispatch(quit())})
    }

    const trayMenu = Menu.buildFromTemplate(menuTemplate)
    setMenu(trayMenu, queue)
  }

  const traySelector = createSelector(
    (state) => state.i18n,
    refreshTray
  )

  yield fork(takeEvery, '*', function * (action) {
    const state = yield select()
    traySelector(state)
  })

  yield call(queue.exhaust)
}

export function getTray () {
  return tray
}
