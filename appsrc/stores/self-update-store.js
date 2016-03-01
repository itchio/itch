

const app = require('electron').app

const AppDispatcher = require('../dispatcher/app-dispatcher')
const AppActions = require('../actions/app-actions')
const AppConstants = require('../constants/app-constants')

const Store = require('./store')
const os = require('../util/os')

let auto_updater

try {
  auto_updater = require('electron').autoUpdater
  auto_updater.on('error', (ev, err) => AppActions.self_update_error(err))
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

  AppActions.check_for_self_update()
  let hours = 6
  let seconds = hours * 60
  let millis = seconds * 1000
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

module.exports = SelfUpdateStore
