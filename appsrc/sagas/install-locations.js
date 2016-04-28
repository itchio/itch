
import Promise from 'bluebird'

import createQueue from './queue'
import {createSelector} from 'reselect'

import diskspace from '../util/diskspace'
import localizer from '../localizer'

import {omit} from 'underline'

import {takeEvery} from 'redux-saga'
import {call, put, select} from 'redux-saga/effects'

import {
  QUERY_FREE_SPACE, WINDOW_FOCUS_CHANGED, TASK_ENDED,
  ADD_INSTALL_LOCATION_REQUEST, ADD_INSTALL_LOCATION
} from '../constants/action-types'

import {
  queryFreeSpace, freeSpaceUpdated, addInstallLocation, updatePreferences
} from '../actions'

import {BrowserWindow, dialog} from '../electron'
import uuid from 'node-uuid'

export function * _addInstallLocationRequest () {
  const i18n = yield select((state) => state.i18n)
  const t = localizer.getT(i18n.strings, i18n.lang)
  const windowId = yield select((state) => state.ui.mainWindow.id)
  const window = BrowserWindow.fromId(windowId)

  if (!window) {
    return
  }

  let dialogOpts = {
    title: t('prompt.install_location_add.title'),
    properties: ['openDirectory']
  }

  const promise = new Promise((resolve, reject) => {
    const callback = (response) => {
      if (!response) {
        return resolve()
      }

      return resolve({
        name: uuid.v4(),
        path: response[0]
      })
    }
    dialog.showOpenDialog(window, dialogOpts, callback)
  })

  const loc = yield promise
  if (loc) {
    yield put(addInstallLocation(loc))
  }
}

export function * _addInstallLocation (action) {
  const loc = action.payload

  yield put(updatePreferences({
    installLocations: {
      [loc.name]: loc::omit('name')
    }
  }))
}

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
    takeEvery(ADD_INSTALL_LOCATION_REQUEST, _addInstallLocationRequest),
    takeEvery(ADD_INSTALL_LOCATION, _addInstallLocation),
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
