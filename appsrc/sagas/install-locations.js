
import Promise from 'bluebird'
import invariant from 'invariant'
import path from 'path'

import createQueue from './queue'
import {createSelector} from 'reselect'

import diskspace from '../util/diskspace'
import explorer from '../util/explorer'
import localizer from '../localizer'

import {omit, each} from 'underline'

import {takeEvery} from 'redux-saga'
import {call, put, select} from 'redux-saga/effects'

import {
  QUERY_FREE_SPACE, WINDOW_FOCUS_CHANGED, TASK_ENDED,
  ADD_INSTALL_LOCATION_REQUEST, ADD_INSTALL_LOCATION,
  REMOVE_INSTALL_LOCATION_REQUEST, REMOVE_INSTALL_LOCATION,
  BROWSE_INSTALL_LOCATION, MAKE_INSTALL_LOCATION_DEFAULT
} from '../constants/action-types'

import {
  queryFreeSpace, freeSpaceUpdated, addInstallLocation, updatePreferences,
  navigate, removeInstallLocation
} from '../actions'

import {BrowserWindow, dialog} from '../electron'
import uuid from 'node-uuid'

export function * _removeInstallLocationRequest (action) {
  const {name} = action.payload
  invariant(typeof name === 'string', 'removed install location name must be a string')
  invariant(name !== 'appdata', 'cannot remove appdata')

  const caves = yield select((state) => state.globalMarket.caves)
  let numItems = 0
  caves::each((cave) => {
    if (cave.name === name) {
      numItems++
    }
  })

  const i18n = yield select((state) => state.i18n)
  const t = localizer.getT(i18n.strings, i18n.lang)

  if (numItems > 0) {
    const buttons = [
      t('prompt.install_location_not_empty.show_contents'),
      t('prompt.action.ok')
    ]

    const dialogOpts = {
      title: t('prompt.install_location_not_empty.title'),
      message: t('prompt.install_location_not_empty.message'),
      detail: t('prompt.install_location_not_empty.detail'),
      buttons
    }

    const promise = new Promise((resolve, reject) => {
      const callback = (response) => {
        resolve(response)
      }
      dialog.showMessageBox(dialogOpts, callback)
    })

    const response = yield promise
    if (response === 0) {
      yield put(navigate(`locations/${name}`))
    }
  }

  {
    const loc = yield select((state) => state.preferences.installLocations[name])

    const buttons = [
      t('prompt.action.confirm_removal'),
      t('prompt.action.cancel')
    ]

    const dialogOpts = {
      title: t('prompt.install_location_remove.title'),
      message: t('prompt.install_location_remove.message'),
      detail: t('prompt.install_location_remove.detail', {location: loc.path}),
      buttons
    }

    const promise = new Promise((resolve, reject) => {
      const callback = (response) => {
        resolve(response)
      }
      dialog.showMessageBox(dialogOpts, callback)
    })

    const response = yield promise
    if (response === 0) {
      yield put(removeInstallLocation({name}))
    }
  }
}

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

export function * _removeInstallLocation (action) {
  const {name} = action.payload
  invariant(typeof name === 'string', 'removed install location name must be a string')
  invariant(name !== 'appdata', 'cannot remove appdata')
  const installLocations = yield select((state) => state.preferences.installLocations)

  yield put(updatePreferences({
    installLocations: {
      ...installLocations,
      [name]: {
        ...installLocations[name],
        deleted: true
      }
    }
  }))
}

export function * _addInstallLocation (action) {
  const loc = action.payload
  const installLocations = yield select((state) => state.preferences.installLocations)

  yield put(updatePreferences({
    installLocations: {
      ...installLocations,
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

export function * _browseInstallLocation (action) {
  const {name} = action.payload
  invariant(typeof name === 'string', 'browsed install location name is a string')

  if (name === 'appdata') {
    const userData = yield select((state) => state.system.userDataPath)
    return explorer.open(path.join(userData, 'apps'))
  } else {
    const loc = yield select((state) => state.preferences.installLocations[name])
    if (!loc) {
      return
    }
    return explorer.open(loc.path)
  }
}

export function * _makeInstallLocationDefault (action) {
  const {name} = action.payload
  invariant(typeof name === 'string', 'default install location name must be a string')

  yield put(updatePreferences({
    defaultInstallLocation: name
  }))
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
    takeEvery(MAKE_INSTALL_LOCATION_DEFAULT, _makeInstallLocationDefault),
    takeEvery(REMOVE_INSTALL_LOCATION_REQUEST, _removeInstallLocationRequest),
    takeEvery(REMOVE_INSTALL_LOCATION, _removeInstallLocation),
    takeEvery(ADD_INSTALL_LOCATION_REQUEST, _addInstallLocationRequest),
    takeEvery(ADD_INSTALL_LOCATION, _addInstallLocation),
    takeEvery(BROWSE_INSTALL_LOCATION, _browseInstallLocation),
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
