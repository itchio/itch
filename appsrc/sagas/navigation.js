
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

import {navigate, openUrl, tabChanged, tabDataFetched} from '../actions'
import {
  SHOW_PREVIOUS_TAB, SHOW_NEXT_TAB, OPEN_URL, TAB_CHANGED,
  VIEW_CREATOR_PROFILE, VIEW_COMMUNITY_PROFILE
} from '../constants/action-types'

export function * _tabChanged (action) {
  const path = action.payload

  if (/^games/.test(path)) {
    const market = getUserMarket()
    const gameId = +pathToId(path)

    const gotGame = function * (game) {
      const data = gameToTabData(game)
      yield put(tabDataFetched({path, data}))
    }

    const game = market.getEntities('games')[gameId]
    if (game) {
      yield call(gotGame, game)
    } else {
      const credentials = yield select((state) => state.session.credentials)
      const fetchedGame = yield call(fetch.gameLazily, market, credentials, gameId)
      yield call(gotGame, fetchedGame)
    }
  } else if (/^users/.test(path)) {
    const market = getUserMarket()
    const userId = +pathToId(path)

    const gotUser = function * (user) {
      const data = userToTabData(user)
      yield put(tabDataFetched({path, data}))
    }

    const user = market.getEntities('users')[userId]
    if (user) {
      yield call(gotUser, user)
    } else {
      console.log('fetching users: stub')
    }
  } else {
    const data = staticTabData[path]
    if (data) {
      yield put(tabDataFetched({path, data}))
    }
  }
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
    takeEvery('*', function * watchNavigation () {
      navigationSelector(yield select())
    }),
    call(queue.exhaust)
  ]
}
