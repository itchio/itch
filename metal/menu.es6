
import Menu from 'menu'
import AppStore from './stores/app_store'
import AppActions from './actions/app_actions'
import AppDispatcher from './dispatcher/app_dispatcher'

import defer from './util/defer'

function refresh_menu () {
  let repo_url = 'https://github.com/itchio/itchio-app'
  function open_url (url) {
    require('shell').openExternal(url)
  }

  let menus = {
    file: {
      label: 'File',
      submenu: [
        {
          label: 'Close Window',
          accelerator: 'CmdOrCtrl+W',
          click: () => AppActions.hide_window()
        },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => AppActions.quit()
        }
      ]
    },

    edit: {
      label: 'Edit',
      visible: false,
      submenu: [
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Select all',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        }
      ]
    },

    account_disabled: {
      label: 'Account',
      submenu: [
        {
          label: 'Not logged in',
          enabled: false
        }
      ]
    },

    account: {
      label: 'Account',
      submenu: [
        {
          label: 'Change user...',
          click: () => AppActions.logout()
        }
      ]
    },

    help: {
      label: 'Help',
      submenu: [
        {
          label: 'View itch.io Terms',
          click: () => open_url('https://itch.io/docs/legal/terms')
        },
        {
          label: 'View License',
          click: () => open_url(`${repo_url}/blob/master/LICENSE`)
        },
        {
          label: `Version ${require('app').getVersion()}`,
          enabled: false
        },
        {
          label: 'Check for Update',
          click: () => console.log('check for update: stub')
        },
        {
          type: 'separator'
        },
        {
          label: 'Report Issue',
          click: () => open_url(`${repo_url}/issues/new`)
        },
        {
          label: 'Search Issue',
          click: () => open_url(`${repo_url}/search?type=Issues`)
        },
        {
          type: 'separator'
        },
        {
          label: 'Release Notes',
          click: () => open_url(`${repo_url}/releases`)
        },
        {
          type: 'separator'
        },
        {
          label: 'Danger zone',
          submenu: [
            {
              label: 'Don\'t use this.',
              submenu: [
                {
                  label: 'Provoke crash',
                  click: () => { throw new Error('Silly human-provoked crash.') }
                }
              ]
            }
          ]
        }
      ]
    }
  }

  let template = [
    menus.file,
    menus.edit,
    (AppStore.get_current_user()
    ? menus.account
    : menus.account_disabled),
    menus.help
  ]

  // gotcha: buildFromTemplate mutates its argument - calling it
  // twice with the same argument throws 'Invalid menu template'
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

export function install () {
  AppDispatcher.register((action) => {
    switch (action.action_type) {
      // TODO: keep an eye on that, might need to rebuild in other circumstances.
      case 'BOOT':
      case 'LOGIN_DONE':
      case 'LOGOUT_DONE':
        defer(() => refresh_menu())
        break
    }
  })
}
