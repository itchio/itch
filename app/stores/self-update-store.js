'use nodent';'use strict'

import app from 'app'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppActions from '../actions/app-actions'
import AppConstants from '../constants/app-constants'

import Store from './store'
import os from '../util/os'

let auto_updater

try {
  auto_updater = require('auto-updater')
  auto_updater.on('error', AppActions.self_update_error)
} catch (e) {
  console.log(`While installing auto updater: ${e.message}`)
  auto_updater = null
}
let SelfUpdateStore = Object.assign(new Store('self-update-store'), {
  // muffin
})

function window_ready () {
  if (!auto_updater) return

  let base = 'https://nuts.itch.zone'
  let platform = os.platform() + '_' + os.arch()
  let version = app.getVersion()

  auto_updater.setFeedUrl(`${base}/update/${platform}/${version}`)
  auto_updater.on('checking-for-update', AppActions.checking_for_self_update)
  auto_updater.on('update-available', AppActions.self_update_available)
  auto_updater.on('update-not-available', AppActions.self_update_not_available)
  auto_updater.on('update-downloaded', (ev, release_notes, release_name) =>
    AppActions.self_update_downloaded(release_name)
  )
}

function check_for_self_update () {
  if (!auto_updater) return
  auto_updater.checkForUpdates()
}

AppDispatcher.register('self-update-store', Store.action_listeners(on => {
  on(AppConstants.CHECK_FOR_SELF_UPDATE, check_for_self_update)
  on(AppConstants.WINDOW_READY, window_ready)
  on(AppConstants.SELF_UPDATE_ERROR, (payload) => console.log(`Auto updater error: ${payload.message}`))
}))

export default SelfUpdateStore
