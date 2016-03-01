
import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'
import Store from './store'

import path from 'path'

import electron from 'electron'
const {app, Menu, Tray} = electron

import os from '../util/os'

let tray

const TrayStore = Object.assign(new Store('tray-store'), {
  with: (cb) => {
    if (!tray) return
    cb(tray)
  }
})

function make_tray () {
  let icon_path = `${__dirname}/../static/images/itchio-tray.png`
  tray = new Tray(path.resolve(icon_path))
  tray.setToolTip('itch.io')
  tray.on('click', () => AppActions.focus_window())
  tray.on('double-click', () => AppActions.focus_window())
  TrayStore.emit_change()
}

function set_menu (tray_menu) {
  if (os.platform() === 'darwin') {
    app.dock.setMenu(tray_menu)
  } else {
    if (!tray) make_tray()
    tray.setContextMenu(tray_menu)
    TrayStore.emit_change()
  }
}

function refresh () {
  let menu_template = [
    { label: 'Owned', click: () => AppActions.focus_panel('owned') },
    { label: 'Dashboard', click: () => AppActions.focus_panel('dashboard') }
  ]

  if (os.platform() !== 'darwin') {
    menu_template = menu_template.concat([
      { type: 'separator' },
      { label: 'Exit', click: () => AppActions.quit() }
    ])
  }

  let tray_menu = Menu.buildFromTemplate(menu_template)
  set_menu(tray_menu)
  TrayStore.emit_change()
}

AppDispatcher.register('tray-store', Store.action_listeners(on => {
  on(AppConstants.BOOT, refresh)
}))

export default TrayStore
