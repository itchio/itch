
import {createSelector} from 'reselect'
import {getUserMarket} from './market'

import invariant from 'invariant'
import ospath from 'path'
import urlParser from 'url'

import {map, filter, pluck} from 'underline'

import {shell} from '../electron'

import staticTabData from '../constants/static-tab-data'

import {pathToId, gameToTabData, userToTabData, collectionToTabData, locationToTabData} from '../util/navigation'
import fetch from '../util/fetch'
import api from '../util/api'
import pathmaker from '../util/pathmaker'

import mklog from '../util/log'
import {opts} from '../logger'
const log = mklog('reactors/navigation')

const TABS_TABLE_NAME = 'itchAppTabs'

import * as actions from '../actions'

async function retrieveTabData (store, id, retrOpts = {}) {
  if (!id) {
    return
  }

  const data = store.getState().session.navigation.tabData[id]
  if (!data) {
    // tab was closed since
    return
  }

  const path = retrOpts.path || data.path
  if (staticTabData[id] && id !== path) {
    console.log(`Refusing to retrieve foreign tabData for frozen tab ${id}`)
    return
  }

  const credentials = store.getState().session.credentials

  if (/^games/.test(path)) {
    const game = await fetch.gameLazily(getUserMarket(), credentials, +pathToId(path), retrOpts)
    return game && gameToTabData(game)
  } else if (/^users/.test(path)) {
    const user = await fetch.userLazily(getUserMarket(), credentials, +pathToId(path), retrOpts)
    return user && userToTabData(user)
  } else if (/^collections\//.test(path)) {
    const collectionId = +pathToId(path)
    const collection = await fetch.collectionLazily(getUserMarket(), credentials, collectionId, retrOpts)
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
          store.dispatch(actions.tabDataFetched({id, timestamp: +new Date(), data: marketData}))
        }
      }

      await fetch.collectionGames(fakeMarket, credentials, collectionId)
      return marketData
    } else {
      return null
    }
  } else if (/^locations/.test(path)) {
    const locationName = pathToId(path)
    let location = store.getState().preferences.installLocations[locationName]
    if (!location) {
      if (locationName === 'appdata') {
        const userDataPath = store.getState().system.userDataPath
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
  } else if (/^toast/.test(path)) {
    return {
      label: ['sidebar.aw_snap']
    }
  } else if (/^url/.test(path)) {
    const existingTabData = store.getState().session.navigation.tabData[id] || {}
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

function toast (store, id, e, path) {
  const data = store.getState().session.navigation.tabData[id]
  if (!data) {
    console.log(`Can't retrieve path for toasted tab ${id}, not found in list. Stack: ${new Error().stack}`)
    return
  }
  const oldPath = path || data.path
  if (/^toast/.test(oldPath)) {
    // already toasted
  } else {
    store.dispatch(actions.evolveTab({id, path: `toast/${oldPath}`, extras: {error: e.toString(), stack: e.stack || 'no stack', label: null}}))
  }
}

async function doFetchTabData (store, id, retrOpts) {
  invariant(typeof store === 'object', 'doFetchTabData has a store')

  const timestamp = +new Date()
  try {
    const data = await retrieveTabData(store, id, retrOpts)
    if (data) {
      store.dispatch(actions.tabDataFetched({id, timestamp, data}))
    }
  } catch (e) {
    if (api.isNetworkError(e)) {
      log(opts, `Skipping tab data fetching because of network (${e.code})`)
    } else {
      log(opts, `Tab data fetching error: ${e.stack || e.message || e}`)
      toast(store, id, e, retrOpts.path)
    }
  }
}

async function tabChanged (store, action) {
  const {id} = action.payload
  invariant(typeof id === 'string', 'tabChanged has string id')

  if (id === 'history') {
    store.dispatch(actions.historyRead())
  }

  await doFetchTabData(store, id)
}

async function tabReloaded (store, action) {
  const {id} = action.payload
  invariant(typeof id === 'string', 'tabReloaded has string id')
  await doFetchTabData(store, id)
}

async function windowFocusChanged (store, action) {
  const {focused} = action.payload
  if (!focused) return

  const id = store.getState().session.navigation.id
  await doFetchTabData(store, id, {fresh: true})
}

let saveTabs = false

async function tabsChanged (store, action) {
  const key = store.getState().session.credentials.key
  if (!key || !saveTabs) {
    log(opts, 'Not logged in, not saving tabs yet...')
    return
  }

  const nav = store.getState().session.navigation
  const {tabs, tabData, id} = nav
  const {transient} = tabs

  const snapshot = {
    current: id,
    items: transient::map((id) => {
      const data = tabData[id]
      if (data) {
        return {
          id,
          path: (data.path || '').replace(/^toast\//, '')
        }
      }
    })::filter((x) => !!x)
  }

  const userMarket = getUserMarket()
  await userMarket.saveEntity(TABS_TABLE_NAME, 'x', snapshot)
}

async function sessionReady (store, action) {
  log(opts, 'Session ready! looking for tabs to restore')
  const userMarket = getUserMarket()
  const snapshot = userMarket.getEntity(TABS_TABLE_NAME, 'x')

  if (snapshot) {
    log(opts, `Restoring ${snapshot.items.length} tabs`)
    store.dispatch(actions.tabsRestored(snapshot))

    for (const item of snapshot.items) {
      const {id, path} = item
      doFetchTabData(store, id, {path})
    }
  } else {
    log(opts, 'No tabs to restore')
  }

  saveTabs = true
}

async function logout (store, action) {
  saveTabs = false
}

async function evolveTab (store, action) {
  const {id, path, extras = {}, quick} = action.payload
  if (quick) {
    store.dispatch(actions.tabEvolved({id, data: {path}}))
  }

  try {
    const data = await retrieveTabData(store, id, {path})
    store.dispatch(actions.tabEvolved({id, data: {...data, ...extras, path}}))
  } catch (e) {
    log(opts, `While evolving tab: ${e.stack || e}`)
    toast(store, id, e, path)
  }
}

async function probeCave (store, action) {
  const {caveId} = action.payload

  const caveLogPath = pathmaker.caveLogPath(caveId)
  log(opts, `Opening cave log path ${caveLogPath}`)
  shell.openItem(caveLogPath)
}

let pathSelector
const makePathSelector = (store) => createSelector(
  (state) => state.session.navigation.id,
  (id) => {
    setImmediate(() => {
      store.dispatch(actions.tabChanged({id}))
    })
  }
)

let transientSelector
const makeTransientSelector = (store) => createSelector(
  (state) => state.session.navigation.tabs.transient,
  (state) => state.session.navigation.tabData,
  (state) => state.session.navigation.id,
  createSelector(
    (transient, tabData, id) => transient,
    (transient, tabData, id) => tabData::pluck('path'),
    (transient, id) => id,
    (ids, paths, id) => {
      setImmediate(() => store.dispatch(actions.tabsChanged(store)))
    }
  )
)

async function windowReady (store, action) {
  if (!pathSelector) {
    pathSelector = makePathSelector(store)
  }
  if (!transientSelector) {
    transientSelector = makeTransientSelector(store)
  }
}

async function catchAll (store, action) {
  const state = store.getState()

  if (pathSelector) {
    pathSelector(state)
  }

  if (transientSelector) {
    transientSelector(state)
  }
}

export function clearFilters (store, action) {
  const {tab} = action.payload

  store.dispatch(actions.binaryFilterChanged({field: 'onlyCompatible', value: false}))
  store.dispatch(actions.filterChanged({tab, query: ''}))
}

export default {
  windowReady, catchAll, sessionReady, tabReloaded, windowFocusChanged,
  evolveTab, probeCave, tabsChanged, tabChanged, logout, clearFilters
}
