
import invariant from 'invariant'

import createQueue from './queue'
import {createSelector} from 'reselect'

import {takeEvery, takeLatest} from 'redux-saga'
import {fork, select, call, put} from 'redux-saga/effects'
import {delay} from './effects'

import mklog from '../util/log'
const log = mklog('fetch-saga')
import {opts} from '../logger'

import {getUserMarket} from './market'
import fetch from '../util/fetch'

import {map, filter, isEqual} from 'underline'

import featuredCollectionIds from '../constants/featured-collection-ids'

import {
  searchFetched,
  searchStarted,
  searchFinished,
  fetchCollectionGames,
  collectionGamesFetched
} from '../actions'

import {
  WINDOW_FOCUS_CHANGED,
  LOGIN_SUCCEEDED,
  FETCH_COLLECTION_GAMES,
  SEARCH,
  DB_COMMIT
} from '../constants/action-types'

function * _windowFocusChanged (action) {
  const {focused} = action.payload
  if (!focused) {
    // app just went in the background, nbd
    return
  }

  const credentials = yield select((state) => state.session.credentials)
  if (!credentials.key) {
    log(opts, `Not logged in, not fetching anything yet`)
    return
  }

  yield call(fetchUsuals, credentials)
}

function * _loginSucceeded (action) {
  const credentials = action.payload
  yield call(fetchUsuals, credentials)
}

function * fetchUsuals (credentials) {
  invariant(credentials.key, 'have API key')

  log(opts, `Fetching the usuals`)

  const market = getUserMarket()

  yield [
    call(fetch.dashboardGames, market, credentials),
    call(fetch.ownedKeys, market, credentials),
    call(fetch.collections, market, credentials, featuredCollectionIds)
  ]
}

function * _search (action) {
  // 200ms debounce
  yield call(delay, 200)

  yield put(searchStarted())

  try {
    const credentials = yield select((state) => state.session.credentials)
    if (!credentials.key) {
      log(opts, `Not logged in, can't search`)
      return
    }

    const query = action.payload
    const results = yield call(fetch.search, credentials, query)

    yield put(searchFetched({results}))
  } catch (e) {
    // TODO: relay search error (network offline, etc.)
  } finally {
    yield put(searchFinished())
  }
}

function * fetchSingleCollectionGames (market, credentials, collectionId) {
  // TODO: error handling
  yield call(fetch.collectionGames, market, credentials, collectionId)
  yield put(collectionGamesFetched({collectionId}))
}

function * _fetchCollectionGames (action) {
  yield call(delay, 300)

  const credentials = yield select((state) => state.session.credentials)
  if (!credentials.key) {
    return
  }
  const market = getUserMarket()

  const collections = yield select((state) => state.market.collections)
  const fetchedCollections = yield select((state) => state.session.cachedCollections.fetched)

  yield collections::map((collection, collectionIdStr) => {
    const collectionId = Number(collectionIdStr)
    const lastFetched = fetchedCollections[collectionId]
    if (!lastFetched) {
      return call(fetchSingleCollectionGames, market, credentials, collectionId)
    }
  })::filter((x) => !!x)
}

export default function * fetchSaga () {
  const queue = createQueue('fetch')

  let oldIds = []
  const collectionsWatcher = createSelector(
    (state) => state.market.collections,
    (collections) => {
      const ids = collections::map((c, id) => id)
      if (!ids::isEqual(oldIds)) {
        oldIds = ids
        queue.dispatch(fetchCollectionGames())
      }
    }
  )

  yield fork(takeEvery, DB_COMMIT, function * () {
    const state = yield select()
    collectionsWatcher(state)
  })

  yield [
    takeEvery(WINDOW_FOCUS_CHANGED, _windowFocusChanged),
    takeEvery(LOGIN_SUCCEEDED, _loginSucceeded),
    takeLatest(FETCH_COLLECTION_GAMES, _fetchCollectionGames),
    takeLatest(SEARCH, _search), // not 'takeEvery', so we cancel lagging searches
    call(queue.exhaust)
  ]
}
