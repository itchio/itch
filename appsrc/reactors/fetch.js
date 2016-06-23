
import Promise from 'bluebird'
import invariant from 'invariant'

import {createSelector} from 'reselect'

import mklog from '../util/log'
const log = mklog('reactors/fetch')
import {opts} from '../logger'

import {getUserMarket} from './market'
import fetch from '../util/fetch'
import api from '../util/api'

import {map, isEqual} from 'underline'
import debounce from './debounce'

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

// FIXME: can't await the debounced version of this anymore!
const fetchUsuals = async function fetchUsuals (credentials) {
  invariant(credentials.key, 'have API key')

  log(opts, 'Fetching the usuals')

  const market = getUserMarket()

  try {
    await Promise.all([
      fetch.dashboardGames(market, credentials),
      fetch.ownedKeys(market, credentials),
      fetch.collections(market, credentials)
    ])
  } catch (e) {
    if (api.isNetworkError(e)) {
      log(opts, `Skipping fetch usuals, having network issues (${e.code})`)
    } else {
      throw e
    }
  }
}::debounce(300)

const search = async function search (store, action) {
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
}::debounce(200)

async function fetchSingleCollectionGames (store, market, credentials, collectionId) {
  await fetch.collectionGames(market, credentials, collectionId)
  store.dispatch(actions.collectionGamesFetched({collectionId}))
}

const fetchCollectionGames = async function fetchCollectionGames (store, action) {
  const credentials = store.getState().session.credentials
  if (!credentials.key) {
    return
  }

  const market = getUserMarket()
  const collections = market.getEntities('collections')

  try {
    for (const key of Object.keys(collections)) {
      await fetchSingleCollectionGames(store, market, credentials, Number(key))
    }
  } catch (e) {
    if (api.isNetworkError(e)) {
      log(opts, 'Network error while fetching collection, skipping..')
    } else {
      throw e
    }
  }
}::debounce(300)

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
