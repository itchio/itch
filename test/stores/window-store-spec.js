'use nodent';'use strict'
let test = require('zopf')
let proxyquire = require('proxyquire')

let AppConstants = require('../../app/constants/app-constants')

let AppDispatcher = require('../stubs/app-dispatcher')
let electron = require('../stubs/electron')

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
