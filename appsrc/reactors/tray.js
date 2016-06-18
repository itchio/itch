
import path from 'path'
import os from '../util/os'
import localizer from '../localizer'
import {app, Menu, Tray} from '../electron'

import {createSelector} from 'reselect'

import * as actions from '../actions'

import {partial} from 'underline'

let tray

function makeTray (store) {
  // cf. https://github.com/itchio/itch/issues/462
  // windows still displays a 16x16, whereas
  // some linux DEs don't know what to do with a @x2, etc.
  const iconName = os.platform() === 'linux' ? `${app.getName()}.png` : `${app.getName()}-small.png`
  const iconPath = path.resolve(`${__dirname}/../static/images/tray/${iconName}`)
  tray = new Tray(iconPath)
  tray.setToolTip('itch.io')
  tray.on('click', () => store.dispatch(actions.focusWindow({toggle: true})))
  tray.on('double-click', () => store.dispatch(actions.focusWindow()))
}

function setMenu (trayMenu, store) {
  if (os.platform() === 'darwin') {
    app.dock.setMenu(trayMenu)
  } else {
    if (!tray) {
      makeTray(store)
    }
    tray.setContextMenu(trayMenu)
  }
}

async function go (store, path) {
  store.dispatch(actions.focusWindow())
  store.dispatch(actions.navigate(path))
}

function refreshTray (store, i18n) {
  const t = localizer.getT(i18n.strings, i18n.lang)
  const menuTemplate = [
    {label: t('sidebar.owned'), click: () => go('library')},
    {label: t('sidebar.dashboard'), click: () => go('dashboard')}
  ]

  if (os.platform() !== 'darwin') {
    menuTemplate.push({type: 'separator'})
    menuTemplate.push({
      label: t('menu.file.quit'),
      click: () => store.dispatch(actions.quit())
    })
  }

  const trayMenu = Menu.buildFromTemplate(menuTemplate)
  setMenu(trayMenu, store)
}

// TODO: make the tray a lot more useful? that'd be good.
// (like: make it display recent stuff / maybe the last few tabs)

let traySelector
const makeTraySelector = (store) => createSelector(
  (state) => state.i18n,
  refreshTray::partial(store)
)

let hasBooted = false

async function boot (store, action) {
  hasBooted = true
}

async function catchAll (store, action) {
  if (!hasBooted) return
  if (!traySelector) {
    traySelector = makeTraySelector(store)
  }
  traySelector(store.getState())
}

export function getTray () {
  return tray
}

export default {boot, catchAll}
