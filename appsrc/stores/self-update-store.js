
import AppDispatcher from '../dispatcher/app-dispatcher'
import AppActions from '../actions/app-actions'
import AppConstants from '../constants/app-constants'

import Store from './store'
import app from '../util/app'
import os from '../util/os'

let auto_updater
try {
  auto_updater = require('electron').autoUpdater
  auto_updater.on('error', (ev, err) => AppActions.self_update_error(err))
} catch (e) {
  console.log(`While installing auto updater: ${e.message}`)
  auto_updater = null
}

const SelfUpdateStore = Object.assign(new Store('self-update-store'), {
  // muffin
})

function window_ready () {
  if (!auto_updater) return

  const base = 'https://nuts.itch.zone'
  const platform = os.platform() + '_' + os.arch()
  const version = app.getVersion()

  auto_updater.setFeedURL(`${base}/update/${platform}/${version}`)
  auto_updater.on('checking-for-update', AppActions.checking_for_self_update)
  auto_updater.on('update-available', AppActions.self_update_available)
  auto_updater.on('update-not-available', AppActions.self_update_not_available)
  auto_updater.on('update-downloaded', (ev, release_notes, release_name) => {
    console.log(`update downloaded, release name: '${release_name}'`)
    console.log(`release notes: \n'${release_notes}'`)
    AppActions.self_update_downloaded(release_name)
  })

  AppActions.check_for_self_update()
  const hours = 6
  const minutes = hours * 60
  const seconds = minutes * 60
  const millis = seconds * 1000
  setInterval(AppActions.check_for_self_update, millis)
}

function check_for_self_update () {
  if (!auto_updater) return
  auto_updater.checkForUpdates()
}

AppDispatcher.register('self-update-store', Store.action_listeners(on => {
  on(AppConstants.CHECK_FOR_SELF_UPDATE, check_for_self_update)
  on(AppConstants.WINDOW_READY, window_ready)
  on(AppConstants.APPLY_SELF_UPDATE_FOR_REALSIES, () => auto_updater.quitAndInstall())
}))

export default SelfUpdateStore
