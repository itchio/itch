
import createQueue from './queue'
import {createSelector} from 'reselect'
import {pathToId, gameToTabData, userToTabData, collectionToTabData, locationToTabData} from '../util/navigation'
import {getUserMarket} from './market'
import {BrowserWindow, Menu, clipboard} from '../electron'

import invariant from 'invariant'
import clone from 'clone'
import ospath from 'path'
import uuid from 'node-uuid'
import urlParser from 'url'

import {shell} from '../electron'
import {delay, takeEvery} from './effects'
import {call, select, put, fork} from 'redux-saga/effects'
import {sortBy, findWhere, map, filter, pluck} from 'underline'

import urls from '../constants/urls'
import staticTabData from '../constants/static-tab-data'
import fetch from '../util/fetch'
import {isItchioURL} from '../util/url'

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
  historyRead, closeModal, loginWithToken, handleItchioUrl, statusMessage,
  dismissStatusMessage
} from '../actions'

import {
  SESSION_READY, SHOW_PREVIOUS_TAB, SHOW_NEXT_TAB, OPEN_URL, TAB_CHANGED, TABS_CHANGED,
  VIEW_CREATOR_PROFILE, VIEW_COMMUNITY_PROFILE, EVOLVE_TAB, TRIGGER_MAIN_ACTION,
  TRIGGER_OK, TRIGGER_BACK, WINDOW_FOCUS_CHANGED, TAB_RELOADED,
  OPEN_TAB_CONTEXT_MENU, INITIATE_PURCHASE, PROBE_CAVE, FOCUS_NTH_TAB, NEW_TAB,
  TOGGLE_MINI_SIDEBAR, COPY_TO_CLIPBOARD, STATUS_MESSAGE
} from '../constants/action-types'

function * retrieveTabData (id, retrOpts = {}) {
  if (!id) {
    return
  }

  const data = yield select((state) => state.session.navigation.tabData[id])
  if (!data) {
    console.log(`Can't retrieve tab data for ${id}, not found in list. Stack: ${new Error().stack}`)
    return
  }

  const path = retrOpts.path || data.path
  if (staticTabData[id] && id !== path) {
    console.log(`Refusing to retrieve foreign tabData for frozen tab ${id}`)
    return
  }

  const credentials = yield select((state) => state.session.credentials)

  if (/^games/.test(path)) {
    const game = yield call(fetch.gameLazily, getUserMarket(), credentials, +pathToId(path), retrOpts)
    return game && gameToTabData(game)
  } else if (/^users/.test(path)) {
    const user = yield call(fetch.userLazily, getUserMarket(), credentials, +pathToId(path), retrOpts)
    return user && userToTabData(user)
  } else if (/^collections\//.test(path)) {
    const collectionId = +pathToId(path)
    const collection = yield call(fetch.collectionLazily, getUserMarket(), credentials, collectionId, retrOpts)
    const newData = collectionToTabData(collection)
    if (collection) {
      log(opts, `fetched collection ${collectionId}`)
      const baseData = {
        ...newData,
        collections: {
          ...newData.collections,
          [collectionId]: {
            ...(((data || {}).collections || {})[collectionId] || {}),
            ...newData.collections[collectionId]
          }
        }
      }

      const queue = createQueue('fetchCollectionGames')
      let marketData = baseData
      const fakeMarket = {
        getEntities: (tableName) => {
          return marketData[tableName] || {}
        },
        saveAllEntities: (response) => {
          for (const tableName of Object.keys(response.entities)) {
            const entities = response.entities[tableName]
            let table = marketData[tableName] || {}

            for (const entityId of Object.keys(entities)) {
              table = {
                ...table,
                [entityId]: {
                  ...table[entityId],
                  ...entities[entityId]
                }
              }
            }

            marketData = {
              ...marketData,
              [tableName]: {
                ...marketData[tableName],
                ...table
              }
            }
          }
          queue.dispatch(tabDataFetched({id, timestamp: +new Date(), data: marketData}))
        }
      }

      const endType = 'DONE_FETCHING_COLLECTION_GAMES'
      yield fork(queue.exhaust, {endType})
      yield call([fetch, fetch.collectionGames], fakeMarket, credentials, collectionId)
      queue.dispatch({type: endType})

      return marketData
    } else {
      return null
    }
  } else if (/^locations/.test(path)) {
    const locationName = pathToId(path)
    let location = yield select((state) => state.preferences.installLocations[locationName])
    if (!location) {
      if (locationName === 'appdata') {
        const userDataPath = yield select((state) => state.system.userDataPath)
        location = {
          path: ospath.join(userDataPath, 'apps')
        }
      }
    }

    return location && locationToTabData(location)
  } else if (/^search/.test(path)) {
    return {
      label: pathToId(path)
    }
  } else if (/^new/.test(path)) {
    return {
      label: ['sidebar.empty']
    }
  } else if (/^url/.test(path)) {
    const existingTabData = (yield select((state) => state.session.navigation.tabData[id])) || {}
    return {
      label: existingTabData.webTitle || (urlParser.parse(pathToId(path)) || {}).hostname,
      iconImage: existingTabData.webFavicon
    }
  } else {
    const data = staticTabData[id]
    if (id) {
      return data
    }
  }
}

function * doFetchTabData (id, retrOpts) {
  const timestamp = +new Date()
  const data = yield call(retrieveTabData, id, retrOpts)
  if (data) {
    yield put(tabDataFetched({id, timestamp, data}))
  } else {
    console.log(`No data fetched for ${id}`)
  }
}

export function * _tabChanged (action) {
  const {id} = action.payload
  invariant(typeof id === 'string', 'tabChanged has string id')

  if (id === 'history') {
    yield put(historyRead())
  }

  yield call(doFetchTabData, id)
}

export function * _tabReloaded (action) {
  const {id} = action.payload
  invariant(typeof id === 'string', 'tabReloaded has string id')
  yield call(doFetchTabData, id)
}

export function * _windowFocusChanged (action) {
  const {focused} = action.payload
  if (!focused) return

  const id = yield select((state) => state.session.navigation.id)
  yield call(doFetchTabData, id, {fresh: true})
}

export function * _tabsChanged (action) {
  const key = yield select((state) => state.session.credentials.key)
  if (!key) {
    log(opts, 'Not logged in, not saving tabs yet...')
    return
  }

  const nav = yield select((state) => state.session.navigation)
  const {tabs, tabData, id} = nav
  const {transient} = tabs

  const snapshot = {
    current: id,
    items: transient::map((id) => {
      const data = tabData[id]
      if (data) {
        return {
          id,
          path: data.path
        }
      }
    })::filter((x) => !!x)
  }

  const userMarket = getUserMarket()
  yield call([userMarket, userMarket.saveEntity], TABS_TABLE_NAME, 'x', snapshot)
}

export function * _sessionReady (action) {
  log(opts, 'Session ready! looking for tabs to restore')
  const userMarket = getUserMarket()
  const snapshot = userMarket.getEntity(TABS_TABLE_NAME, 'x')

  if (snapshot) {
    log(opts, `Restoring ${snapshot.items.length} tabs`)
    yield put(tabsRestored(snapshot))

    const timestamp = +new Date()
    const tabDatas = yield snapshot.items::map(({id, path}) => call(retrieveTabData, id, {path}))
    yield tabDatas::map((data, i) => {
      if (!data) return null
      const {id} = snapshot.items[i]
      return put(tabDataFetched({id, timestamp, data}))
    })
  } else {
    log(opts, 'No tabs to restore')
  }
}

export function * _evolveTab (action) {
  const {id, path} = action.payload
  const data = yield call(retrieveTabData, id, {path})
  yield put(tabEvolved({id, data: {...data, path}}))
}

export function * applyTabOffset (offset) {
  const {id, tabs} = yield select((state) => state.session.navigation)
  const {constant, transient} = tabs

  const ids = constant.concat(transient)
  const numTabs = ids.length

  const index = ids.indexOf(id)

  // adding numPaths takes care of negative wrapping too!
  const newIndex = (index + offset + numTabs) % numTabs
  const newId = ids[newIndex]

  yield put(navigate(newId))
}

export function * _newTab (action) {
  yield put(navigate('new/' + uuid.v4()))
}

export function * _focusNthTab (action) {
  const n = action.payload
  const constant = yield select((state) => state.session.navigation.tabs.constant)
  const tab = constant[n - 1]
  if (tab) {
    yield put(navigate(tab))
  }
}

export function * _showPreviousTab () {
  yield * applyTabOffset(-1)
}

export function * _showNextTab () {
  yield * applyTabOffset(1)
}

export function * _openUrl (action) {
  const uri = action.payload
  if (isItchioURL(uri)) {
    yield put(handleItchioUrl({uri}))
  } else {
    yield call([shell, shell.openExternal], uri)
  }
}

export function * _viewCreatorProfile (action) {
  const url = yield select((state) => state.session.credentials.me.url)
  yield put(navigate('url/' + url))
}

export function * _viewCommunityProfile (action) {
  const url = yield select((state) => state.session.credentials.me.url)
  const host = urlParser.parse(url).hostname
  const slug = /^[^.]+/.exec(host)
  yield put(navigate('url/' + `${urls.itchio}/profile/${slug}`))
}

export function * _triggerMainAction () {
  const id = yield select((state) => state.session.navigation.id)
  const data = yield select((state) => state.session.navigation.tabData[id])
  if (!data) {
    return
  }

  const {path} = data
  if (/^games/.test(path)) {
    const gameId = +pathToId(path)
    const game = (data.games || {})[gameId]
    if (game) {
      // FIXME: queueGame is a bit too tolerant
      yield put(queueGame({game}))
    }
  }
}

export function * _triggerOk () {
  const modals = yield select((state) => state.modals)
  const [modal] = modals
  if (!modal) {
    const page = yield select((state) => state.session.navigation.page)
    const picking = yield select((state) => state.session.login.picking)
    if (page === 'gate' && picking) {
      const rememberedSessions = yield select((state) => state.rememberedSessions)
      const mostRecentSession = rememberedSessions::sortBy((x) => -x.lastConnected)[0]
      if (mostRecentSession) {
        const {me, key} = mostRecentSession
        const {username} = me
        yield put(loginWithToken({username, key, me}))
      }
    }
    return
  }

  const [button] = modal.buttons
  if (!button) {
    return
  }

  const {action} = button

  if (action) {
    if (Array.isArray(action)) {
      for (const a of action) {
        yield put(a)
      }
    } else {
      yield put(action)
    }
  }
  yield put(closeModal())
}

export function * _triggerBack () {
  const modals = yield select((state) => state.modals)
  const [modal] = modals
  if (!modal) {
    return
  }

  yield put(closeModal())
}

function makeTabContextMenu (queue) {
  const f = function * _openTabContextMenu (action) {
    invariant(typeof action.payload === 'object', 'opentabcontextmenu payload is an object')
    const {id} = action.payload
    invariant(typeof id === 'string', 'opentabcontextmenu path is string')

    const data = yield select((state) => state.session.navigation.tabData[id])
    if (!data) {
      log(opts, `Can't make context menu for non-transient tab ${id}`)
      return
    }

    const {path} = data
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
              click: () => queue.dispatch(checkForGameUpdate({caveId: cave.id, noisy: true}))
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

  return function * (action) {
    try {
      yield call(f, action)
    } catch (err) {
      log(opts, `While opening tab context menu: ${err.stack || err}`)
    }
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

function * _copyToClipboard (action) {
  clipboard.writeText(action.payload)

  yield put(statusMessage(['status.copied_to_clipboard']))
}

function * _statusMessage (action) {
  yield call(delay, 5000)
  yield put(dismissStatusMessage())
}

export default function * navigationSaga () {
  const queue = createQueue('navigation')

  const pathSelector = createSelector(
    (state) => state.session.navigation.id,
    (id) => {
      queue.dispatch(tabChanged({id}))
    }
  )

  const transientSelector = createSelector(
    (state) => state.session.navigation.tabs.transient,
    (state) => state.session.navigation.tabData,
    (state) => state.session.navigation.id,
    createSelector(
      (transient, tabData, id) => transient,
      (transient, tabData, id) => tabData::pluck('path'),
      (transient, id) => id,
      (ids, paths, id) => {
        queue.dispatch(tabsChanged())
      }
    )
  )

  yield [
    takeEvery(SESSION_READY, _sessionReady),
    takeEvery(NEW_TAB, _newTab),
    takeEvery(FOCUS_NTH_TAB, _focusNthTab),
    takeEvery(SHOW_PREVIOUS_TAB, _showPreviousTab),
    takeEvery(SHOW_NEXT_TAB, _showNextTab),
    takeEvery(OPEN_URL, _openUrl),
    takeEvery(COPY_TO_CLIPBOARD, _copyToClipboard),
    takeEvery(STATUS_MESSAGE, _statusMessage),
    takeEvery(VIEW_CREATOR_PROFILE, _viewCreatorProfile),
    takeEvery(VIEW_COMMUNITY_PROFILE, _viewCommunityProfile),
    takeEvery(TAB_CHANGED, _tabChanged),
    takeEvery(TAB_RELOADED, _tabReloaded),
    takeEvery(WINDOW_FOCUS_CHANGED, _windowFocusChanged),
    takeEvery(TABS_CHANGED, _tabsChanged),
    takeEvery(EVOLVE_TAB, _evolveTab),
    takeEvery(TRIGGER_MAIN_ACTION, _triggerMainAction),
    takeEvery(TRIGGER_OK, _triggerOk),
    takeEvery(TRIGGER_BACK, _triggerBack),
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
