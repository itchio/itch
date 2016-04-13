
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

import {navigate, openUrl, tabChanged, tabDataFetched, tabEvolved} from '../actions'
import {
  SHOW_PREVIOUS_TAB, SHOW_NEXT_TAB, OPEN_URL, TAB_CHANGED,
  VIEW_CREATOR_PROFILE, VIEW_COMMUNITY_PROFILE, EVOLVE_TAB
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
  } else {
    console.log('no data found for', path)
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

export default function * navigationSaga () {
  const queue = createQueue('navigation')

  const navigationSelector = createSelector(
    (state) => state.session.navigation.path,
    (path) => {
      queue.dispatch(tabChanged(path))
    }
  )

  yield [
    takeEvery(SHOW_PREVIOUS_TAB, _showPreviousTab),
    takeEvery(SHOW_NEXT_TAB, _showNextTab),
    takeEvery(OPEN_URL, _openUrl),
    takeEvery(VIEW_CREATOR_PROFILE, _viewCreatorProfile),
    takeEvery(VIEW_COMMUNITY_PROFILE, _viewCommunityProfile),
    takeEvery(TAB_CHANGED, _tabChanged),
    takeEvery(EVOLVE_TAB, _evolveTab),
    takeEvery('*', function * watchNavigation () {
      navigationSelector(yield select())
    }),
    call(queue.exhaust)
  ]
}
