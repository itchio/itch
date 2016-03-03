
import test from 'zopf'
import proxyquire from 'proxyquire'

import AppConstants from '../../app/constants/app-constants'

import AppActions from '../stubs/app-actions'
import AppDispatcher from '../stubs/app-dispatcher'
import electron from '../stubs/electron'

test('NotificationStore', t => {
  const os = {
    __esModule: true,
    default: {
      platform: () => 'darwin'
    },
    '@noCallThru': true
  }

  const TrayStore = {
    __esModule: true,
    default: {
      with: (cb) => cb(electron.electron.Tray)
    },
    '@noCallThru': true
  }

  const WindowStore = {
    __esModule: true,
    default: {
      with: (cb) => cb(electron.electron.BrowserWindow)
    },
    '@noCallThru': true
  }

  const stubs = Object.assign({
    '../util/os': os,
    '../actions/app-actions': AppActions,
    '../dispatcher/app-dispatcher': AppDispatcher,
    './window-store': WindowStore,
    './tray-store': TrayStore
  }, electron)

  const NotificationStore = proxyquire('../../app/stores/notification-store', stubs).default
  const handler = AppDispatcher.get_handler('notification-store')

  t.case('notify (win32)', t => {
    t.stub(os.default, 'platform').returns('win32')
    t.mock(electron.electron.Tray).expects('displayBalloon')
    handler({ action_type: AppConstants.NOTIFY })
  })

  t.case('notify (others)', t => {
    t.stub(os.default, 'platform').returns('darwin')
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
