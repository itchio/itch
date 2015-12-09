'use nodent';'use strict'
import test from 'zopf'
import proxyquire from 'proxyquire'

import AppConstants from '../../app/constants/app-constants'

import AppDispatcher from '../stubs/app-dispatcher'
import electron from '../stubs/electron'

test('WindowStore', t => {
  let stubs = Object.assign({
    '../dispatcher/app-dispatcher': AppDispatcher
  }, electron)

  let WindowStore = proxyquire('../../app/stores/window-store', stubs)
  let handler = AppDispatcher.get_handler('window-store')
  let window

  t.case('boot', t => {
    WindowStore.with(w => window = w)
    t.notOk(window)
    process.env.DEVTOOLS = 1
    handler({ action_type: AppConstants.BOOT })
    WindowStore.with(w => window = w)
    t.ok(window)
  })

  t.case('hide_window', t => {
    t.mock(window).expects('hide')
    handler({ action_type: AppConstants.HIDE_WINDOW })
  })

  t.case('show_window', t => {
    t.mock(window).expects('show')
    handler({ action_type: AppConstants.FOCUS_WINDOW })
  })

  t.case('eval', t => {
    t.mock(window.webContents).expects('executeJavaScript')
    handler({ action_type: AppConstants.EVAL, code: 'alert("Haxx")' })
  })
})
