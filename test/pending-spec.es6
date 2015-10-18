import test from 'zopf'
import proxyquire from 'proxyquire'

import electron from './stubs/electron'

let setup = (t) => {
  let stubs = electron

  ;['app-store', 'credentials-store', 'notification-store', 'tray-store', 'window-store'].forEach((name) => {
    proxyquire(`../app/stores/${name}`, stubs)
  })

  ;['menu'].forEach((name) => {
    proxyquire(`../app/ui/${name}`, stubs)
  })
}

test('pending specs', t => {
  setup(t)
})
