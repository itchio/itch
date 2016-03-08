
import {Menu, shell, app} from '../../electron'

import os from '../../util/os'
import urls from '../../constants/urls'
import crash_reporter from '../../util/crash-reporter'

import clone from 'clone'

import {loop, Effects} from 'redux-loop'
import {handleActions} from 'redux-actions'
import {createSelector} from 'reselect'
import {
  navigate,
  hideWindow,
  quitWhenMain,
  changeUser,
  refreshMenu,
  checkForSelfUpdate
} from '../../actions'

const osx = (os.platform() === 'darwin')

export default handleActions({
  WINDOW_READY: (state, action) => {
    mountMenu(state)
    return loop(state, Effects.constant(refreshMenu()))
  },

  REFRESH_MENU: (state, action) => {
    const {i18n, credentials} = action.payload
    return {template: computeMenuTemplate(i18n, credentials)}
  }
}, {template: []})

function mountMenu (state) {
  const store = require('../../store').default

  const refreshSelector = createSelector(
    (state) => state.i18n,
    (state) => state.session.credentials,
    (i18n, credentials) => {
      store.dispatch(refreshMenu())
    }
  )

  const applySelector = createSelector(
    (state) => state.ui.menu,
    (menuState) => {
      // electron gotcha: buildFromTemplate mutates its argument
      const menu = Menu.buildFromTemplate(clone(menuState.template))
      Menu.setApplicationMenu(menu)
    }
  )

  store.subscribe(() => {
    const state = store.getState()
    refreshSelector(state)
    applySelector(state)
  })
}

function computeMenuTemplate (i18n, credentials) {
  const store = require('../../store').default

  // XXX: get t from somewhere
  const _t = (x) => x

  const menus = {
    file: {
      label: _t('menu.file.file'),
      submenu: [
        {
          label: _t('menu.file.preferences'),
          accelerator: (osx ? 'Cmd+,' : 'Ctrl+P'),
          click: () => store.dispatch(navigate('preferences'))
        },
        {
          type: 'separator'
        },
        {
          label: _t('menu.file.close_window'),
          accelerator: (osx ? 'Cmd+W' : 'Alt+F4'),
          click: () => store.dispatch(hideWindow())
        },
        {
          label: _t('menu.file.quit'),
          accelerator: 'CmdOrCtrl+Q',
          click: () => store.dispatch(quitWhenMain())
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
          click: () => store.dispatch(changeUser())
        }
      ]
    },

    help: {
      label: _t('menu.help.help'),
      submenu: [
        {
          label: _t('menu.help.view_terms'),
          click: () => shell.openExternal(urls.terms_of_service)
        },
        {
          label: _t('menu.help.view_license'),
          click: () => shell.openExternal(`${urls.itch_repo}/blob/master/LICENSE`)
        },
        {
          label: `Version ${app.getVersion()}`,
          enabled: false
        },
        {
          label: _t('menu.help.check_for_update'),
          click: () => store.dispatch(checkForSelfUpdate())
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
          click: () => shell.openExternal(`${urls.itch_repo}/search?type=Issues`)
        },
        {
          type: 'separator'
        },
        {
          label: _t('menu.help.release_notes'),
          click: () => shell.openExternal(`${urls.itch_repo}/releases`)
        }
      ]
    }
  }

  const template = [
    menus.file,
    menus.edit,
    (credentials.currentUser
    ? menus.account
    : menus.account_disabled),
    menus.help
  ]
  Object.freeze(template)

  return template
}
