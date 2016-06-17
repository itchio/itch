
import Promise from 'bluebird'
import invariant from 'invariant'

import {createSelector} from 'reselect'

import mklog from '../util/log'
const log = mklog('reactors/fetch')
import {opts} from '../logger'

import {getUserMarket} from './market'
import fetch from '../util/fetch'

import {map, isEqual} from 'underline'

import * as actions from '../actions'

async function windowFocusChanged (store, action) {
  const {focused} = action.payload
  if (!focused) {
    // app just went in the background, nbd
    return
  }

  const credentials = store.getState().session.credentials
  if (!credentials.key) {
    log(opts, 'Not logged in, not fetching anything yet')
    return
  }

  await fetchUsuals(credentials)
}

async function loginSucceeded (store, action) {
  const credentials = action.payload
  await fetchUsuals(credentials)
}

async function purchaseCompleted (store, action) {
  const credentials = store.getState().session.credentials
  if (!credentials.key) {
    log(opts, 'Not logged in, not fetching anything yet')
    return
  }

  await fetchUsuals(credentials)
}

async function fetchUsuals (credentials) {
  invariant(credentials.key, 'have API key')

  log(opts, 'Fetching the usuals')

  const market = getUserMarket()

  await Promise.all([
    fetch.dashboardGames(market, credentials),
    fetch.ownedKeys(market, credentials),
    fetch.collections(market, credentials)
  ])
}

async function search (store, action) {
  // TODO: 200ms debounce

  store.dispatch(actions.searchStarted())

  try {
    const credentials = store.getState().session.credentials
    if (!credentials.key) {
      log(opts, 'Not logged in, can\'t search')
      return
    }

    const query = action.payload
    if (!query) {
      log(opts, 'Clearing query')
      store.dispatch(actions.searchFetched({query: '', results: null}))
      return
    }

    const results = await fetch.search(credentials, query)
    store.dispatch(actions.searchFetched({query, results}))
  } catch (e) {
    // TODO: relay search error (network offline, etc.)
  } finally {
    store.dispatch(actions.searchFinished())
  }
}

async function fetchSingleCollectionGames (store, market, credentials, collectionId) {
  await fetch.collectionGames(market, credentials, collectionId)
  log(opts, `fetched collection ${collectionId}!`)
  store.dispatch(actions.collectionGamesFetched({collectionId}))
}

async function fetchCollectionGames (store, action) {
  // TODO: 300ms debounce

  const credentials = store.getState().session.credentials
  if (!credentials.key) {
    return
  }

  const market = getUserMarket()
  const collections = market.getEntities('collections')

  for (const key of Object.keys(collections)) {
    log(opts, `fetching collection ${key}`)
    await fetchSingleCollectionGames(store, market, credentials, Number(key))
  }
}

const makeCollectionsWatcher = (store) => {
  let oldIds = []

  return createSelector(
    (state) => state.market.collections,
    (collections) => {
      const ids = collections::map((c, id) => id)
      if (!ids::isEqual(oldIds)) {
        oldIds = ids
        store.dispatch(actions.fetchCollectionGames())
      }
    }
  )
}
let collectionsWatcher

async function userDbCommit (store, action) {
  if (!collectionsWatcher) {
    collectionsWatcher = makeCollectionsWatcher(store)
  }
  collectionsWatcher(store.getState())
}

async function userDbReady (store, action) {
  await fetchCollectionGames(store, action)
}

export default {windowFocusChanged, loginSucceeded, purchaseCompleted, fetchCollectionGames, userDbCommit, userDbReady, search}
