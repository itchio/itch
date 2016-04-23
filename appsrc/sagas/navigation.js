
import createQueue from './queue'
import {createSelector} from 'reselect'
import {pathToId, gameToTabData, userToTabData, collectionToTabData} from '../util/navigation'
import {getUserMarket} from './market'
import {BrowserWindow, Menu} from '../electron'

import invariant from 'invariant'
import clone from 'clone'

import {shell} from '../electron'
import {takeEvery} from 'redux-saga'
import {call, select, put} from 'redux-saga/effects'
import {findWhere, map, pluck} from 'underline'

import urls from '../constants/urls'
import staticTabData from '../constants/static-tab-data'
import fetch from '../util/fetch'

import localizer from '../localizer'

import classificationActions from '../constants/classification-actions'

import mklog from '../util/log'
import {opts} from '../logger'
const log = mklog('navigation')

const TABS_TABLE_NAME = 'itchAppTabs'

import {
  navigate, openUrl, tabChanged, tabsChanged, tabDataFetched, tabEvolved,
  queueGame, tabsRestored, checkForGameUpdate, probeCave,
  queueCaveReinstall, queueCaveUninstall, exploreCave, initiatePurchase,
  historyRead
} from '../actions'

import {
  SESSION_READY, SHOW_PREVIOUS_TAB, SHOW_NEXT_TAB, OPEN_URL, TAB_CHANGED, TABS_CHANGED,
  VIEW_CREATOR_PROFILE, VIEW_COMMUNITY_PROFILE, EVOLVE_TAB, TRIGGER_MAIN_ACTION,
  WINDOW_FOCUS_CHANGED, TAB_RELOADED, OPEN_TAB_CONTEXT_MENU, INITIATE_PURCHASE,
  PROBE_CAVE
} from '../constants/action-types'

function * retrieveTabData (path, opts) {
  const credentials = yield select((state) => state.session.credentials)

  if (/^games/.test(path)) {
    const game = yield call(fetch.gameLazily, getUserMarket(), credentials, +pathToId(path), opts)
    return game && gameToTabData(game)
  } else if (/^users/.test(path)) {
    const user = yield call(fetch.userLazily, getUserMarket(), credentials, +pathToId(path), opts)
    return user && userToTabData(user)
  } else if (/^collections/.test(path)) {
    const collection = yield call(fetch.collectionLazily, getUserMarket(), credentials, +pathToId(path), opts)
    return collection && collectionToTabData(collection)
  } else {
    const data = staticTabData[path]
    if (data) {
      yield put(tabDataFetched({path, data}))
    }
  }
}

export function * _tabChanged (action) {
  const {path} = action.payload
  invariant(typeof path === 'string', 'tabChanged has stringy path')

  if (path === 'history') {
    yield put(historyRead())
  }

  const data = yield call(retrieveTabData, path)
  if (data) {
    yield put(tabDataFetched({path, data}))
  }
}

export function * _tabReloaded (action) {
  const {path} = action.payload
  invariant(typeof path === 'string', 'tabReloaded has stringy path')

  const data = yield call(retrieveTabData, path, {fresh: true})
  if (data) {
    yield put(tabDataFetched({path, data}))
  }
}

export function * _windowFocusChanged (action) {
  const {focused} = action.payload
  if (!focused) return

  const path = yield select((state) => state.session.navigation.path)
  const data = yield call(retrieveTabData, path, {fresh: true})
  if (data) {
    yield put(tabDataFetched({path, data}))
  }
}

export function * _tabsChanged (action) {
  const key = yield select((state) => state.session.credentials.key)
  if (!key) {
    log(opts, `Not logged in, not saving tabs yet...`)
    return
  }

  const nav = yield select((state) => state.session.navigation)
  const {tabs, path} = nav
  const {transient} = tabs

  const snapshot = {
    current: path,
    items: transient::pluck('path')
  }

  const userMarket = getUserMarket()
  yield call([userMarket, userMarket.saveEntity], TABS_TABLE_NAME, 'x', snapshot)
}

export function * _sessionReady (action) {
  log(opts, `Session ready! looking for tabs to restore`)
  const userMarket = getUserMarket()
  const snapshot = userMarket.getEntity(TABS_TABLE_NAME, 'x')

  if (snapshot) {
    log(opts, `Restoring ${snapshot.items.length} tabs`)
    yield put(tabsRestored(snapshot))

    const tabDatas = yield snapshot.items::map((path) => call(retrieveTabData, path))
    yield tabDatas::map((data, i) => {
      if (!data) return null
      const path = snapshot.items[i]
      return put(tabDataFetched({path, data}))
    })
  } else {
    log(opts, `No tabs to restore`)
  }
}

export function * _evolveTab (action) {
  const {before, after} = action.payload
  const data = yield call(retrieveTabData, after)
  yield put(tabEvolved({before, after, data}))
}

export function * applyTabOffset (offset) {
  const {path, tabs} = yield select((state) => state.session.navigation)
  const {constant, transient} = tabs

  const paths = constant::pluck('path').concat(transient::pluck('path'))
  const numPaths = paths.length

  const index = paths.indexOf(path)

  // adding numPaths takes care of negative wrapping too!
  const newIndex = (index + offset + numPaths) % numPaths
  const newPath = paths[newIndex]

  yield put(navigate(newPath))
}

export function * _showPreviousTab () {
  yield* applyTabOffset(-1)
}

export function * _showNextTab () {
  yield* applyTabOffset(1)
}

export function * _openUrl (action) {
  const uri = action.payload
  yield call([shell, shell.openExternal], uri)
}

export function * _viewCreatorProfile (action) {
  const url = yield select((state) => state.session.credentials.me.url)
  yield put(openUrl(url))
}

export function * _viewCommunityProfile (action) {
  const username = yield select((state) => state.session.credentials.me.username)
  yield put(openUrl(`${urls.itchio}/profile/${username}`))
}

export function * _triggerMainAction () {
  const path = yield select((state) => state.session.navigation.path)
  if (/^games/.test(path)) {
    const gameId = +pathToId(path)
    const tabData = yield select((state) => state.session.navigation.tabData)
    const data = tabData[path] || {}
    const game = (data.games || {})[gameId]
    if (game) {
      yield put(queueGame({game}))
    }
  }
}

function makeTabContextMenu (queue) {
  return function * _openTabContextMenu (action) {
    invariant(typeof action.payload === 'object', 'opentabcontextmenu payload is an object')
    const {path} = action.payload
    invariant(typeof path === 'string', 'opentabcontextmenu path is string')

    const data = yield select((state) => state.session.navigation.tabData[path])
    const i18n = yield select((state) => state.i18n)
    const t = localizer.getT(i18n.strings, i18n.lang)

    const template = []
    if (/^games/.test(path)) {
      const gameId = pathToId(path)
      const game = ((data || {}).games || {})[gameId]
      const action = classificationActions[game.classification] || 'launch'
      const cave = yield select((state) => state.globalMarket.cavesByGameId[gameId])

      if (cave) {
        template.push({
          label: t(`grid.item.${action}`),
          click: () => queue.dispatch(queueGame({game}))
        })
        template.push({
          label: t('grid.item.show_local_files'),
          click: () => queue.dispatch(exploreCave({caveId: cave.id}))
        })
        template.push({ type: 'separator' })
        template.push({
          label: t('grid.item.developer'),
          submenu: [
            {
              label: t('grid.item.check_for_update'),
              click: () => queue.dispatch(checkForGameUpdate({caveId: cave.id}))
            },
            {
              label: t('grid.item.open_debug_log'),
              click: () => queue.dispatch(probeCave({caveId: cave.id}))
            }
          ]
        })
        template.push({ type: 'separator' })
        template.push({
          label: t('prompt.uninstall.reinstall'),
          click: () => queue.dispatch(queueCaveReinstall({caveId: cave.id}))
        })
        template.push({
          label: t('prompt.uninstall.uninstall'),
          click: () => queue.dispatch(queueCaveUninstall({caveId: cave.id}))
        })
      } else {
        const downloadKeys = getUserMarket().getEntities('downloadKeys')
        const downloadKey = downloadKeys::findWhere({gameId: game.id})
        const hasMinPrice = game.minPrice > 0
        // FIXME game admins
        const meId = yield select((state) => state.session.credentials.me.id)
        const canEdit = game.userId === meId
        const mayDownload = !!(downloadKey || !hasMinPrice || canEdit)

        if (mayDownload) {
          template.push({
            label: t('grid.item.install'),
            click: () => queue.dispatch(queueGame({game}))
          })
        } else {
          template.push({
            label: t('grid.item.buy_now'),
            click: () => queue.dispatch(initiatePurchase({game}))
          })
        }
      }
    }

    const menu = Menu.buildFromTemplate(clone(template))
    const mainWindowId = yield select((state) => state.ui.mainWindow.id)
    const mainWindow = BrowserWindow.fromId(mainWindowId)
    menu.popup(mainWindow)
  }
}

function * _initiatePurchase (action) {
  const {game} = action.payload
  // wooooo crunch
  yield put(openUrl(game.url + '/purchase'))
}

function * _probeCave (action) {
  // ditto
  yield put(openUrl('https://gist.github.com/fasterthanlime/fc0116df32b53c7939016afe0d26796d'))
}

export default function * navigationSaga () {
  const queue = createQueue('navigation')

  const pathSelector = createSelector(
    (state) => state.session.navigation.path,
    (path) => {
      queue.dispatch(tabChanged({path}))
    }
  )

  const transientSelector = createSelector(
    (state) => state.session.navigation.tabs.transient,
    (state) => state.session.navigation.path,
    createSelector(
      (transient, path) => transient::pluck('path').join(','),
      (transient, path) => path,
      (pathList, path) => {
        queue.dispatch(tabsChanged())
      }
    )
  )

  yield [
    takeEvery(SESSION_READY, _sessionReady),
    takeEvery(SHOW_PREVIOUS_TAB, _showPreviousTab),
    takeEvery(SHOW_NEXT_TAB, _showNextTab),
    takeEvery(OPEN_URL, _openUrl),
    takeEvery(VIEW_CREATOR_PROFILE, _viewCreatorProfile),
    takeEvery(VIEW_COMMUNITY_PROFILE, _viewCommunityProfile),
    takeEvery(TAB_CHANGED, _tabChanged),
    takeEvery(TAB_RELOADED, _tabReloaded),
    takeEvery(WINDOW_FOCUS_CHANGED, _windowFocusChanged),
    takeEvery(TABS_CHANGED, _tabsChanged),
    takeEvery(EVOLVE_TAB, _evolveTab),
    takeEvery(TRIGGER_MAIN_ACTION, _triggerMainAction),
    takeEvery(INITIATE_PURCHASE, _initiatePurchase),
    takeEvery(PROBE_CAVE, _probeCave),
    takeEvery(OPEN_TAB_CONTEXT_MENU, makeTabContextMenu(queue)),
    takeEvery('*', function * watchNavigation () {
      const state = yield select()
      pathSelector(state)
      transientSelector(state)
    }),
    call(queue.exhaust)
  ]
}
