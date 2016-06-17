
import {createSelector} from 'reselect'
import {getUserMarket} from './market'

import invariant from 'invariant'
import ospath from 'path'
import urlParser from 'url'

import {map, filter, pluck} from 'underline'

import staticTabData from '../constants/static-tab-data'

import {pathToId, gameToTabData, userToTabData, collectionToTabData, locationToTabData} from '../util/navigation'
import fetch from '../util/fetch'

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
    console.log(`Can't retrieve tab data for ${id}, not found in list. Stack: ${new Error().stack}`)
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

async function doFetchTabData (store, id, retrOpts) {
  invariant(typeof store === 'object', 'doFetchTabData has a store')

  const timestamp = +new Date()
  const data = await retrieveTabData(store, id, retrOpts)
  if (data) {
    store.dispatch(actions.tabDataFetched({id, timestamp, data}))
  } else {
    console.log(`No data fetched for ${id}`)
  }
}

async function tabChanged (store, id) {
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

async function tabsChanged (store, action) {
  const key = store.getState().session.credentials.key
  if (!key) {
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
          path: data.path
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
}

async function evolveTab (store, action) {
  const {id, path} = action.payload
  const data = await retrieveTabData(store, id, {path})
  store.dispatch(actions.tabEvolved({id, data: {...data, path}}))
}

async function probeCave (store, action) {
  // TODO: uncrunch this
  store.dispatch(actions.openUrl('https://gist.github.com/fasterthanlime/fc0116df32b53c7939016afe0d26796d'))
}

let pathSelector
const makePathSelector = (store) => createSelector(
  (state) => state.session.navigation.id,
  (id) => {
    store.dispatch(actions.tabChanged(store, id))
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
      store.dispatch(actions.tabsChanged(store))
    }
  )
)

async function boot (store, action) {
  if (!pathSelector) {
    pathSelector = makePathSelector(store)
  }

  if (!transientSelector) {
    transientSelector = makeTransientSelector(store)
  }

  const state = store.getState()
  pathSelector(state)
  transientSelector(state)
}

export default {
  boot, sessionReady, tabReloaded, windowFocusChanged,
  evolveTab, probeCave, tabsChanged, tabChanged
}
