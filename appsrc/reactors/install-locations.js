
import Promise from 'bluebird'
import invariant from 'invariant'
import path from 'path'
import uuid from 'node-uuid'

import {omit, each} from 'underline'

import {createSelector} from 'reselect'

import diskspace from '../util/diskspace'
import explorer from '../util/explorer'
import localizer from '../localizer'

import * as actions from '../actions'

import {BrowserWindow, dialog} from '../electron'

async function removeInstallLocationRequest (store, action) {
  const {name} = action.payload
  invariant(typeof name === 'string', 'removed install location name must be a string')
  invariant(name !== 'appdata', 'cannot remove appdata')

  const caves = store.getState().globalMarket.caves
  let numItems = 0
  caves::each((cave) => {
    if (cave.installLocation === name) {
      numItems++
    }
  })

  const i18n = store.getState().i18n
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

    const response = await promise
    if (response === 0) {
      store.dispatch(actions.navigate(`locations/${name}`))
    }
    return
  }

  {
    const loc = store.getState().preferences.installLocations[name]

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

    const response = await promise
    if (response === 0) {
      store.dispatch(actions.removeInstallLocation({name}))
    }
  }
}

async function addInstallLocationRequest (store, action) {
  const i18n = store.getState().i18n
  const t = localizer.getT(i18n.strings, i18n.lang)
  const windowId = store.getState().ui.mainWindow.id
  const window = BrowserWindow.fromId(windowId)

  if (!window) {
    return
  }

  const dialogOpts = {
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

  const loc = await promise
  if (loc) {
    store.dispatch(actions.addInstallLocation(loc))
  }
}

async function removeInstallLocation (store, action) {
  const {name} = action.payload
  invariant(typeof name === 'string', 'removed install location name must be a string')
  invariant(name !== 'appdata', 'cannot remove appdata')
  const installLocations = store.getState().preferences.installLocations
  let defaultInstallLocation = store.getState().preferences.defaultInstallLocation

  if (defaultInstallLocation === name) {
    defaultInstallLocation = 'appdata'
  }

  store.dispatch(actions.updatePreferences({
    defaultInstallLocation,
    installLocations: {
      ...installLocations,
      [name]: {
        ...installLocations[name],
        deleted: true
      }
    }
  }))
}

async function addInstallLocation (store, action) {
  const loc = action.payload
  const installLocations = store.getState().preferences.installLocations

  store.dispatch(actions.updatePreferences({
    installLocations: {
      ...installLocations,
      [loc.name]: loc::omit('name')
    }
  }))
}

async function windowFocusChanged (store, action) {
  const {focused} = action.payload
  if (focused) {
    store.dispatch(actions.queryFreeSpace())
  }
}

async function taskEnded (store, action) {
  const id = store.getState().session.navigation.id
  if (id === 'preferences') {
    store.dispatch(actions.queryFreeSpace())
  }
}

async function queryFreeSpace (store, action) {
  const diskInfo = await diskspace.diskInfo()
  store.dispatch(actions.freeSpaceUpdated({diskInfo}))
}

async function browseInstallLocation (store, action) {
  const {name} = action.payload
  invariant(typeof name === 'string', 'browsed install location name is a string')

  if (name === 'appdata') {
    const userData = store.getState().system.userDataPath
    return explorer.open(path.join(userData, 'apps'))
  } else {
    const loc = store.getState().preferences.installLocations[name]
    if (!loc) {
      return
    }
    return explorer.open(loc.path)
  }
}

async function makeInstallLocationDefault (store, action) {
  const {name} = action.payload
  invariant(typeof name === 'string', 'default install location name must be a string')

  store.dispatch(actions.updatePreferences({
    defaultInstallLocation: name
  }))
}

let selector
const makeSelector = (store) => createSelector(
  (state) => state.preferences.installLocations,
  (state) => state.session.navigation.id,
  (installLocs, id) => {
    setImmediate(() => {
      if (id === 'preferences') {
        store.dispatch(actions.queryFreeSpace())
      }
    })
  }
)

async function catchAll (store, action) {
  if (!selector) {
    selector = makeSelector(store)
  }
  selector(store.getState())
}

export default {makeInstallLocationDefault,
  removeInstallLocationRequest, removeInstallLocation,
  addInstallLocationRequest, addInstallLocation,
  browseInstallLocation, queryFreeSpace,
  windowFocusChanged, taskEnded, catchAll
}
