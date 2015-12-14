'use strict'

let app = require('electron').app

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppActions = require('../actions/app-actions')
let AppConstants = require('../constants/app-constants')

let Store = require('./store')
let os = require('../util/os')

let auto_updater

try {
  auto_updater = require('electron').autoUpdater
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

  auto_updater.setFeedURL(`${base}/update/${platform}/${version}`)
  auto_updater.on('checking-for-update', AppActions.checking_for_self_update)
  auto_updater.on('update-available', AppActions.self_update_available)
  auto_updater.on('update-not-available', AppActions.self_update_not_available)
  auto_updater.on('update-downloaded', (ev, release_notes, release_name) => {
    console.log(`update downloaded, release name: '${release_name}'`)
    console.log(`release notes: \n'${release_notes}'`)
    AppActions.self_update_downloaded(release_name)
  })
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

module.exports = SelfUpdateStore
