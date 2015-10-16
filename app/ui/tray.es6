
import path from 'path'
import app from 'app'
import Menu from 'menu'
import Tray from 'tray'

import os from '../util/os'
import AppActions from '../actions/app-actions'

// TODO: turn that into a store
let self = {
  make_tray: function () {
    let tray_menu_template = [
      { label: 'Owned', click: () => AppActions.focus_panel('owned') },
      { label: 'Dashboard', click: () => AppActions.focus_panel('dashboard') }
    ]

    if (os.platform() !== 'darwin') {
      tray_menu_template = tray_menu_template.concat([
        { type: 'separator' },
        { label: 'Exit', click: () => AppActions.quit() }
      ])
    }

    let tray_menu = Menu.buildFromTemplate(tray_menu_template)

    if (os.platform() === 'darwin') {
      app.dock.setMenu(tray_menu)
    } else {
      let icon_path = `${__dirname}/../static/images/itchio-tray-small.png`
      let tray = new Tray(path.resolve(icon_path))
      tray.setToolTip('itch.io')
      tray.setContextMenu(tray_menu)
      tray.on('clicked', () => AppActions.focus_window())
      tray.on('double-clicked', () => AppActions.focus_window())
      app.main_tray = tray
    }
  }
}

export default self
