
import {Menu} from '../electron'

import {map} from 'underline'
import {takeEvery} from 'redux-saga'
import {call, put, fork, select} from 'redux-saga/effects'
import {createSelector} from 'reselect'

import clone from 'clone'
import createQueue from './queue'

import {
  MENU_ACTION
} from '../constants/action-types'

export default function * menuSaga () {
  const queue = createQueue('menu')

  const refreshSelector = createSelector(
    (state) => state.i18n,
    (state) => state.session.credentials,
    (state) => state.mainWindow,
    (i18n, credentials, mainWindow) => {
      console.log(`refreshSelector is active! trying to dispatch something, if we can!`)
      queue.dispatch(refreshMenu())
    }
  )

  const applySelector = createSelector(
    (state) => state.ui.menu.template,
    (state) => state.i18n,
    (template, i18n) => {
      // electron gotcha: buildFromTemplate mutates its argument
      const menu = Menu.buildFromTemplate(clone(fleshOutTemplate(template, i18n, queue)))
      console.log(`setting menu`)
      Menu.setApplicationMenu(menu)
    }
  )

  yield fork(takeEvery, '*', function * (action) {
    const state = yield select()
    refreshSelector(state)
    applySelector(state)
    console.log(`menu ran selectors`)
  })

  yield fork(takeEvery, MENU_ACTION, function * (action) {
    console.log(`got a menu action!`, JSON.stringify(action))
    const menuAction = convertMenuAction(action.payload)
    if (menuAction) {
      queue.dispatch(menuAction)
    }
  })

  yield* queue.exhaust()
  // const name = 'menu-queue'
  // const endType = '<none>'
  //
  // while (true) {
  //   console.log(`${name}: in while(true)`)
  //   const action = yield call(queue.pump)
  //   console.log(`${name}: putting action ${action.type}`)
  //   yield put(action)
  //   console.log(`${name}: done putting action ${action.type}`)
  //   if (action.type === endType) {
  //     console.log(`${name}: was endType, stopping!`)
  //     return
  //   }
  // }
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
  reportIssue
} from '../actions'

function convertMenuAction (label) {
  console.log(`converting menu action: ${label}`)
  switch (label) {
    case 'menu.file.close_window': return hideWindow()
    case 'menu.file.quit': return quitWhenMain()
    case 'menu.file.preferences': return navigate('preferences')
    case 'menu.account.change_user': return changeUser()
    case 'menu.help.view_terms': return openExternal(urls.terms_of_service)
    case 'menu.help.view_license': return openExternal(`${urls.itch_repo}/blob/master/LICENSE`)
    case 'menu.help.check_for_update': return checkForSelfUpdate()
    case 'menu.help.report_issue': return reportIssue()
    case 'menu.help.search_issue': return openExternal(`${urls.itch_repo}/search?type=Issues`)
    case 'menu.help.release_notes': return openExternal(`${urls.itch_repo}/releases`)
    default: console.log(`Unhandled menu action: ${label}`)
  }
}

function fleshOutTemplate (template, i18n, queue) {
  console.log(`base template = `, JSON.stringify(template, null, 3))

  const t = (x) => x

  const visitNode = (input) => {
    if (input.type === 'separator') {
      return input
    }

    const {label, role = null, enabled = true} = input
    const node = clone(input)

    node.label = t(label)
    console.log(`enabled / role = `, enabled, role)
    if (enabled && !role) {
      node.click = () => {
        console.log(`menu click! label = ${label}`)
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
