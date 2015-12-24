'use strict'

let Menu = require('electron').Menu

let CredentialsStore = require('../stores/credentials-store')
let I18nStore = require('../stores/i18n-store')
let AppActions = require('../actions/app-actions')
let AppConstants = require('../constants/app-constants')
let AppDispatcher = require('../dispatcher/app-dispatcher')

let clone = require('clone')

let os = require('../util/os')
let crash_reporter = require('../util/crash-reporter')

let osx = (os.platform() === 'darwin')

function make_menus () {
  let _t = I18nStore.get_state().getFixedT(null, null)

  let menus = {
    file: {
      label: _t('menu.file.file'),
      submenu: [
        {
          label: _t('menu.file.preferences'),
          accelerator: (osx ? 'Cmd+,' : 'Ctrl+P'),
          click: AppActions.open_preferences
        },
        {
          type: 'separator'
        },
        {
          label: _t('menu.file.close_window'),
          accelerator: (osx ? 'Cmd+W' : 'Alt+F4'),
          click: AppActions.hide_window
        },
        {
          label: _t('menu.file.quit'),
          accelerator: 'CmdOrCtrl+Q',
          click: AppActions.quit
        }
      ]
    },

    edit: {
      label: _t('menu.edit.edit'),
      visible: false,
      submenu: [
        {
          label: _t('menu.edit.cut'),
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: _t('menu.edit.copy'),
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: _t('menu.edit.paste'),
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: _t('menu.edit.select_all'),
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        }
      ]
    },

    account_disabled: {
      label: _t('menu.account.account'),
      submenu: [
        {
          label: _t('menu.account.not_logged_in'),
          enabled: false
        }
      ]
    },

    account: {
      label: _t('menu.account.account'),
      submenu: [
        {
          label: _t('menu.account.change_user'),
          click: () => AppActions.change_user()
        }
      ]
    },

    help: {
      label: _t('menu.help.help'),
      submenu: [
        {
          label: _t('menu.help.view_terms'),
          click: () => crash_reporter.open_url('https://itch.io/docs/legal/terms')
        },
        {
          label: _t('menu.help.view_license'),
          click: () => crash_reporter.open_url(`${crash_reporter.repo_url}/blob/master/LICENSE`)
        },
        {
          label: `Version ${require('electron').app.getVersion()}`,
          enabled: false
        },
        {
          label: _t('menu.help.check_for_update'),
          click: AppActions.check_for_self_update
        },
        {
          type: 'separator'
        },
        {
          label: _t('menu.help.report_issue'),
          click: () => crash_reporter.report_issue()
        },
        {
          label: _t('menu.help.search_issue'),
          click: () => crash_reporter.open_url(`${crash_reporter.repo_url}/search?type=Issues`)
        },
        {
          type: 'separator'
        },
        {
          label: _t('menu.help.release_notes'),
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
        label: _t('menu.danger_zone.danger_zone'),
        submenu: [
          {
            label: _t('menu.danger_zone.dont_use'),
            submenu: [
              {
                label: _t('menu.danger_zone.provoke_crash'),
                click: () => { throw new Error('Silly human-provoked crash.') }
              }
            ]
          }
        ]
      }
    ])
  }

  return menus
}

function refresh_menu () {
  let menus = make_menus()
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
    I18nStore.add_change_listener('menu', refresh_menu)
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
