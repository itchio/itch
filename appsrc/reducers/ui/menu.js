
import {handleActions} from 'redux-actions'

import os from '../util/os'
const osx = os.itchPlatform() === 'osx'

export default handleActions({
  REFRESH_MENU: (state, action) => {
    return {template: computeMenuTemplate(action.payload)}
  }
}, {template: []})

function computeMenuTemplate (payload) {
  const {system, credentials, miniSidebar} = payload
  const menus = {
    file: {
      label: 'menu.file.file',
      submenu: [
        {
          label: 'menu.file.preferences',
          accelerator: (system.osx ? 'Cmd+,' : 'Ctrl+P')
        },
        {
          type: 'separator'
        },
        {
          label: 'menu.file.close_tab',
          accelerator: 'CmdOrCtrl+W'
        },
        {
          label: 'menu.file.close_window',
          accelerator: (system.osx ? 'Cmd+Shift+W' : 'Alt+F4')
        },
        {
          label: 'menu.file.quit',
          accelerator: 'CmdOrCtrl+Q'
        }
      ]
    },

    edit: {
      label: 'menu.edit.edit',
      visible: false,
      submenu: [
        {
          label: 'menu.edit.cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'menu.edit.copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'menu.edit.paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'menu.edit.select_all',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        }
      ]
    },

    view: {
      label: 'menu.view.view',
      submenu: [
        {
          label: 'menu.view.mini_sidebar',
          type: 'checkbox',
          checked: miniSidebar,
          accelerator: 'CmdOrCtrl+I'
        },
        {
          type: 'separator'
        },
        {
          label: 'menu.view.history',
          accelerator: osx ? 'Cmd+Y' : 'Ctrl+H'
        },
        {
          label: 'menu.view.downloads',
          accelerator: 'CmdOrCtrl+J'
        }
      ]
    },

    account_disabled: {
      label: 'menu.account.account',
      submenu: [
        {
          label: 'menu.account.not_logged_in',
          enabled: false
        }
      ]
    },

    account: {
      label: 'menu.account.account',
      submenu: [
        {
          label: 'menu.account.change_user'
        }
      ]
    },

    help: {
      label: 'menu.help.help',
      submenu: [
        {
          label: 'menu.help.view_terms'
        },
        {
          label: 'menu.help.view_license'
        },
        {
          label: `Version ${system.appVersion}`,
          enabled: false
        },
        {
          label: 'menu.help.check_for_update'
        },
        {
          type: 'separator'
        },
        {
          label: 'menu.help.report_issue'
        },
        {
          label: 'menu.help.search_issue'
        },
        {
          type: 'separator'
        },
        {
          label: 'menu.help.release_notes'
        }
      ]
    }
  }

  const template = [
    menus.file,
    menus.edit,
    menus.view,
    (credentials.key
    ? menus.account
    : menus.account_disabled),
    menus.help
  ]
  return template
}
