
import createQueue from './queue'
import {createSelector} from 'reselect'

import diskspace from '../util/diskspace'

import {takeEvery} from 'redux-saga'
import {call, put, select} from 'redux-saga/effects'

import {QUERY_FREE_SPACE, WINDOW_FOCUS_CHANGED, TASK_ENDED} from '../constants/action-types'
import {queryFreeSpace, freeSpaceUpdated} from '../actions'

export function * _windowFocusChanged (action) {
  const {focused} = action.payload
  if (focused) {
    yield put(queryFreeSpace())
  }
}

export function * _taskEnded (action) {
  const path = yield select((state) => state.session.navigation.path)
  if (path === 'preferences') {
    yield put(queryFreeSpace())
  }
}

export function * _queryFreeSpace (action) {
  const diskInfo = yield call([diskspace, diskspace.diskInfo])
  yield put(freeSpaceUpdated({diskInfo}))
}

export default function * installLocationSaga () {
  const queue = createQueue('installLocations')
  const selector = createSelector(
    (state) => state.preferences.installLocations,
    (state) => state.session.navigation.path,
    (installLocs, path) => {
      if (path === 'preferences') {
        queue.dispatch(queryFreeSpace())
      }
    }
  )

  yield [
    takeEvery(QUERY_FREE_SPACE, _queryFreeSpace),
    takeEvery(WINDOW_FOCUS_CHANGED, _windowFocusChanged),
    takeEvery(TASK_ENDED, _taskEnded),
    takeEvery('*', function * watchInstallLocations () {
      const state = yield select()
      selector(state)
    }),
    call(queue.exhaust)
  ]
}
