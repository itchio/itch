
import createQueue from './queue'
import {createSelector} from 'reselect'
import {pathToId, gameToTabData, userToTabData} from '../util/navigation'
import {getUserMarket} from './market'

import {shell} from '../electron'
import {takeEvery} from 'redux-saga'
import {call, select, put} from 'redux-saga/effects'
import {pluck} from 'underline'

import urls from '../constants/urls'
import staticTabData from '../constants/static-tab-data'
import fetch from '../util/fetch'

import {navigate, openUrl, tabChanged, tabsChanged, tabDataFetched, tabEvolved, queueGame} from '../actions'
import {
  SHOW_PREVIOUS_TAB, SHOW_NEXT_TAB, OPEN_URL, TAB_CHANGED, TABS_CHANGED,
  VIEW_CREATOR_PROFILE, VIEW_COMMUNITY_PROFILE, EVOLVE_TAB, TRIGGER_MAIN_ACTION
} from '../constants/action-types'

function * retrieveTabData (path) {
  const credentials = yield select((state) => state.session.credentials)

  if (/^games/.test(path)) {
    const game = yield call(fetch.gameLazily, getUserMarket(), credentials, +pathToId(path))
    return game && gameToTabData(game)
  } else if (/^users/.test(path)) {
    const user = yield call(fetch.userLazily, getUserMarket(), credentials, +pathToId(path))
    return user && userToTabData(user)
  } else {
    const data = staticTabData[path]
    if (data) {
      yield put(tabDataFetched({path, data}))
    }
  }
}

export function * _tabChanged (action) {
  const path = action.payload
  const data = yield call(retrieveTabData, path)
  if (data) {
    yield put(tabDataFetched({path, data}))
  }
}

export function * _tabsChanged (action) {
  const nav = yield select((state) => state.session.navigation)
  const {tabs, path} = nav
  const {transient} = tabs

  const snapshot = {
    current: path,
    items: transient::pluck('path')
  }
  console.log(`should snapshot tabs: `, JSON.stringify(snapshot, null, 2))
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

export default function * navigationSaga () {
  const queue = createQueue('navigation')

  const pathSelector = createSelector(
    (state) => state.session.navigation.path,
    (path) => {
      queue.dispatch(tabChanged(path))
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
    takeEvery(SHOW_PREVIOUS_TAB, _showPreviousTab),
    takeEvery(SHOW_NEXT_TAB, _showNextTab),
    takeEvery(OPEN_URL, _openUrl),
    takeEvery(VIEW_CREATOR_PROFILE, _viewCreatorProfile),
    takeEvery(VIEW_COMMUNITY_PROFILE, _viewCommunityProfile),
    takeEvery(TAB_CHANGED, _tabChanged),
    takeEvery(TABS_CHANGED, _tabsChanged),
    takeEvery(EVOLVE_TAB, _evolveTab),
    takeEvery(TRIGGER_MAIN_ACTION, _triggerMainAction),
    takeEvery('*', function * watchNavigation () {
      const state = yield select()
      pathSelector(state)
      transientSelector(state)
    }),
    call(queue.exhaust)
  ]
}
