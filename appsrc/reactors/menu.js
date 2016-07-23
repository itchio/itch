
import {Menu} from '../electron'

import {map} from 'underline'
import {createSelector} from 'reselect'

import clone from 'clone'
import localizer from '../localizer'

import urls from '../constants/urls'
import * as actions from '../actions'

import os from '../util/os'
const macos = os.itchPlatform() === 'osx'

let refreshSelector
const makeRefreshSelector = (store) => createSelector(
  (state) => state.system,
  (state) => state.session.credentials,
  (system, credentials) => {
    setImmediate(() =>
      store.dispatch(actions.refreshMenu({system, credentials}))
    )
  }
)

let applySelector
const makeApplySelector = (store) => createSelector(
  (state) => state.ui.menu.template,
  (state) => state.i18n,
  (template, i18n) => {
    setImmediate(() => {
      // electron gotcha: buildFromTemplate mutates its argument
      const menu = Menu.buildFromTemplate(clone(fleshOutTemplate(template, i18n, store)))
      Menu.setApplicationMenu(menu)
    })
  }
)

function convertMenuAction (payload) {
  const {role, label} = payload

  switch (role) {
    case 'about': return actions.openUrl(urls.appHomepage)
    default: // muffin
  }

  switch (label) {
    case 'sidebar.new_tab': return actions.newTab()
    case 'menu.file.close_tab': return macos ? actions.closeTabOrAuxWindow() : actions.closeTab()
    case 'menu.file.close_all_tabs': return actions.closeAllTabs()
    case 'menu.file.close_window': return actions.hideWindow()
    case 'menu.file.quit': return actions.quitWhenMain()
    case 'menu.file.preferences': return actions.navigate('preferences')
    case 'menu.view.downloads': return actions.navigate('downloads')
    case 'menu.view.history': return actions.navigate('history')
    case 'menu.account.change_user': return actions.changeUser()
    // TODO: change to proper about tab/window
    case 'menu.help.about': return actions.openUrl(urls.appHomepage)
    case 'menu.help.view_terms': return actions.openUrl(urls.termsOfService)
    case 'menu.help.view_license': return actions.openUrl(`${urls.itchRepo}/blob/master/LICENSE`)
    case 'menu.help.check_for_update': return actions.checkForSelfUpdate()
    case 'menu.help.report_issue': return actions.openUrl(`${urls.itchRepo}/issues/new`)
    case 'menu.help.search_issue': return actions.openUrl(`${urls.itchRepo}/search?type=Issues`)
    case 'menu.help.release_notes': return actions.openUrl(`${urls.itchRepo}/releases`)
    case 'crash.test':
      ;(async function () { throw new Error('crash test!') })()
      return null
  }
}

async function catchAll (store, action) {
  const state = store.getState()
  if (!refreshSelector) {
    refreshSelector = makeRefreshSelector(store)
  }
  refreshSelector(state)

  if (!applySelector) {
    applySelector = makeApplySelector(store)
  }
  applySelector(state)
}

function fleshOutTemplate (template, i18n, store) {
  const t = localizer.getT(i18n.strings, i18n.lang)

  const visitNode = (input) => {
    if (input.type === 'separator') {
      return input
    }

    const {label, role = null, enabled = true} = input
    const node = clone(input)

    node.label = t(label)
    const menuAction = convertMenuAction({label, role})
    if (enabled && menuAction) {
      node.click = (e) => {
        store.dispatch(menuAction)
      }
    }

    if (node.submenu) {
      node.submenu = node.submenu::map(visitNode)
    }

    return node
  }

  return template::map(visitNode)
}

export default {catchAll}
