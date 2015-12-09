'use nodent';'use strict'
import test from 'zopf'
import proxyquire from 'proxyquire'

import AppConstants from '../../app/constants/app-constants'

import AppActions from '../stubs/app-actions'
import AppDispatcher from '../stubs/app-dispatcher'
import electron from '../stubs/electron'
import defer from '../stubs/defer'

test('NotificationStore', t => {
  let os = {
    platform: () => 'darwin'
  }

  let TrayStore = {
    with: (cb) => cb(electron.tray)
  }

  let WindowStore = {
    with: (cb) => cb(electron['browser-window'])
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
    t.mock(electron.tray).expects('displayBalloon')
    handler({ action_type: AppConstants.NOTIFY })
  })

  t.case('notify (others)', t => {
    t.stub(os, 'platform').returns('darwin')
    t.mock(AppActions).expects('eval')
    handler({ action_type: AppConstants.NOTIFY })
  })

  t.case('bounce', t => {
    let old_dock = electron.app.dock
    electron.app.dock = null
    handler({ action_type: AppConstants.BOUNCE })

    electron.app.dock = old_dock
    t.mock(electron.app.dock).expects('bounce')
    handler({ action_type: AppConstants.BOUNCE })
  })

  t.case('set_progress', t => {
    t.mock(electron.app.dock).expects('setBadge').withArgs('50%')
    t.mock(electron['browser-window']).expects('setProgressBar').withArgs(0.5)
    handler({ action_type: AppConstants.SET_PROGRESS, alpha: 0.5 })
    t.is(NotificationStore.get_progress(), 0.5)
  })

  t.case('set_progress (clear)', t => {
    t.mock(electron.app.dock).expects('setBadge').withArgs('')
    t.mock(electron['browser-window']).expects('setProgressBar').withArgs(-1)
    handler({ action_type: AppConstants.SET_PROGRESS, alpha: -1 })
  })
})
