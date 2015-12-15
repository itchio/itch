

let test = require('zopf')
let proxyquire = require('proxyquire')

let AppConstants = require('../../app/constants/app-constants')

let AppActions = require('../stubs/app-actions')
let AppDispatcher = require('../stubs/app-dispatcher')
let electron = require('../stubs/electron')
let defer = require('../stubs/defer')

test('NotificationStore', t => {
  let os = {
    platform: () => 'darwin'
  }

  let TrayStore = {
    with: (cb) => cb(electron.electron.Tray)
  }

  let WindowStore = {
    with: (cb) => cb(electron.electron.BrowserWindow)
  }

  let stubs = Object.assign({
    '../util/os': os,
    '../util/defer': defer,
    '../actions/app-actions': AppActions,
    '../dispatcher/app-dispatcher': AppDispatcher,
    './window-store': WindowStore,
    './tray-store': TrayStore
  }, electron)

  let NotificationStore = proxyquire('../../app/stores/notification-store', stubs)
  let handler = AppDispatcher.get_handler('notification-store')

  t.case('notify (win32)', t => {
    t.stub(os, 'platform').returns('win32')
    t.mock(electron.electron.Tray).expects('displayBalloon')
    handler({ action_type: AppConstants.NOTIFY })
  })

  t.case('notify (others)', t => {
    t.stub(os, 'platform').returns('darwin')
    t.mock(AppActions).expects('eval')
    handler({ action_type: AppConstants.NOTIFY })
  })

  t.case('bounce', t => {
    let old_dock = electron.electron.app.dock
    electron.electron.app.dock = null
    handler({ action_type: AppConstants.BOUNCE })

    electron.electron.app.dock = old_dock
    t.mock(electron.electron.app.dock).expects('bounce')
    handler({ action_type: AppConstants.BOUNCE })
  })

  t.case('set_progress', t => {
    t.mock(electron.electron.app.dock).expects('setBadge').withArgs('50%')
    t.mock(electron.electron.BrowserWindow).expects('setProgressBar').withArgs(0.5)
    handler({ action_type: AppConstants.SET_PROGRESS, alpha: 0.5 })
    t.is(NotificationStore.get_progress(), 0.5)
  })

  t.case('set_progress (clear)', t => {
    t.mock(electron.electron.app.dock).expects('setBadge').withArgs('')
    t.mock(electron.electron.BrowserWindow).expects('setProgressBar').withArgs(-1)
    handler({ action_type: AppConstants.SET_PROGRESS, alpha: -1 })
  })
})
