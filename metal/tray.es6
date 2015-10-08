
import path from 'path'
import app from 'app'
import Menu from 'menu'
import Tray from 'tray'

import os from './util/os'
import AppActions from './actions/app_actions'

export function make_tray () {
  let tray_menu_template = [
    {
      label: 'Owned',
      click: () => AppActions.focus_panel('owned')
    },
    {
      label: 'Dashboard',
      click: () => AppActions.focus_panel('dashboard')
    }
  ]
  if (os.platform() !== 'darwin') {
    tray_menu_template = tray_menu_template.concat([
      {
        type: 'separator'
      },
      {
        label: 'Exit',
        click: () => AppActions.quit()
      }
    ])
  }

  let tray_menu = Menu.buildFromTemplate(tray_menu_template)

  if (os.platform() === 'darwin') {
    app.dock.setMenu(tray_menu)
  } else {
    let tray = new Tray(path.resolve(`${__dirname}/../static/images/itchio-tray-small.png`))
    tray.setToolTip('itch.io')
    tray.setContextMenu(tray_menu)
    tray.on('clicked', () => AppActions.focus_window())
    tray.on('double-clicked', () => AppActions.focus_window())
    app.main_tray = tray
  }
}
