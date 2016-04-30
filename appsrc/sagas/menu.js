
import {Menu} from '../electron'

import {map} from 'underline'
import {takeEvery} from 'redux-saga'
import {fork, select} from 'redux-saga/effects'
import {createSelector} from 'reselect'

import clone from 'clone'
import createQueue from './queue'
import localizer from '../localizer'

import {
  MENU_ACTION
} from '../constants/action-types'

export default function * menuSaga () {
  const queue = createQueue('menu')

  const refreshSelector = createSelector(
    (state) => state.system,
    (state) => state.session.credentials,
    (state) => state.preferences.miniSidebar,
    (system, credentials, miniSidebar) => {
      queue.dispatch(refreshMenu({system, credentials, miniSidebar}))
    }
  )

  const applySelector = createSelector(
    (state) => state.ui.menu.template,
    (state) => state.i18n,
    (template, i18n) => {
      // electron gotcha: buildFromTemplate mutates its argument
      const menu = Menu.buildFromTemplate(clone(fleshOutTemplate(template, i18n, queue)))
      Menu.setApplicationMenu(menu)
    }
  )

  yield fork(takeEvery, '*', function * (action) {
    const state = yield select()
    refreshSelector(state)
    applySelector(state)
  })

  yield fork(takeEvery, MENU_ACTION, function * (action) {
    const menuAction = convertMenuAction(action.payload)
    if (menuAction) {
      queue.dispatch(menuAction)
    }
  })

  yield * queue.exhaust()
}

import urls from '../constants/urls'

import {
  hideWindow,
  quitWhenMain,
  refreshMenu,
  menuAction,
  navigate,
  openExternal,
  changeUser,
  checkForSelfUpdate,
  reportIssue,
  closeTab,
  closeTabOrAuxWindow,
  toggleMiniSidebar
} from '../actions'

import os from '../util/os'
const osx = os.itchPlatform() === 'osx'

function convertMenuAction (label) {
  switch (label) {
    case 'menu.file.close_tab': return osx ? closeTabOrAuxWindow() : closeTab()
    case 'menu.file.close_window': return hideWindow()
    case 'menu.file.quit': return quitWhenMain()
    case 'menu.file.preferences': return navigate('preferences')
    case 'menu.view.mini_sidebar': return toggleMiniSidebar()
    case 'menu.account.change_user': return changeUser()
    case 'menu.help.view_terms': return openExternal(urls.termsOfService)
    case 'menu.help.view_license': return openExternal(`${urls.itchRepo}/blob/master/LICENSE`)
    case 'menu.help.check_for_update': return checkForSelfUpdate()
    case 'menu.help.report_issue': return reportIssue()
    case 'menu.help.search_issue': return openExternal(`${urls.itchRepo}/search?type=Issues`)
    case 'menu.help.release_notes': return openExternal(`${urls.itchRepo}/releases`)
    default: console.log(`Unhandled menu action: ${label}`)
  }
}

function fleshOutTemplate (template, i18n, queue) {
  const t = localizer.getT(i18n.strings, i18n.lang)

  const visitNode = (input) => {
    if (input.type === 'separator') {
      return input
    }

    const {label, role = null, enabled = true} = input
    const node = clone(input)

    node.label = t(label)
    if (enabled && !role) {
      node.click = () => {
        queue.dispatch(menuAction(label))
      }
    }

    if (node.submenu) {
      node.submenu = node.submenu::map(visitNode)
    }

    return node
  }

  return template::map(visitNode)
}
