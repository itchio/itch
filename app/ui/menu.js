'use strict'

let i18n = require('../util/i18n')
let Menu = require('electron').Menu

let CredentialsStore = require('../stores/credentials-store')
let AppActions = require('../actions/app-actions')
let AppConstants = require('../constants/app-constants')
let AppDispatcher = require('../dispatcher/app-dispatcher')

let os = require('../util/os')

let clone = require('clone')

let crash_reporter = require('../util/crash-reporter')

let osx = (os.platform() === 'darwin')

let menus = {
  file: {
    label: i18n.__('File'),
    submenu: [
      {
        label: 'Preferences',
        accelerator: (osx ? 'Cmd+' : 'Ctrl+P'),
        click: AppActions.open_preferences
      },
      {
        label: 'Close Window',
        accelerator: (osx ? 'Cmd+W' : 'Alt+F4'),
        click: AppActions.hide_window
      },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: AppActions.quit
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
        click: () => AppActions.change_user()
      }
    ]
  },

  help: {
    label: 'Help',
    submenu: [
      {
        label: 'View itch.io Terms',
        click: () => crash_reporter.open_url('https://itch.io/docs/legal/terms')
      },
      {
        label: 'View License',
        click: () => crash_reporter.open_url(`${crash_reporter.repo_url}/blob/master/LICENSE`)
      },
      {
        label: `Version ${require('electron').app.getVersion()}`,
        enabled: false
      },
      {
        label: 'Check for Update',
        click: AppActions.check_for_self_update
      },
      {
        type: 'separator'
      },
      {
        label: 'Report Issue',
        click: () => crash_reporter.report_issue()
      },
      {
        label: 'Search Issue',
        click: () => crash_reporter.open_url(`${crash_reporter.repo_url}/search?type=Issues`)
      },
      {
        type: 'separator'
      },
      {
        label: 'Release Notes',
        click: () => crash_reporter.open_url(`${crash_reporter.repo_url}/releases`)
      }
    ]
  }
}

if (process.env.DANGER_ZONE) {
  menus.help.submenu = menus.help.submenu.concat([
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
  ])
}

function refresh_menu () {
  let template = [
    menus.file,
    menus.edit,
    (CredentialsStore.get_current_user()
    ? menus.account
    : menus.account_disabled),
    menus.help
  ]

  // electron gotcha: buildFromTemplate mutates its argument
  template = clone(template)
  let menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

let self = {
  mount: () => {
    CredentialsStore.add_change_listener('menu', refresh_menu)
    AppDispatcher.register('menu', (payload) => {
      if (payload.action_type === AppConstants.FOCUS_GAIN) {
        console.log(`Gained focus, refreshing menu`)
        refresh_menu()
      }
    })
    refresh_menu()
  }
}

module.exports = self
