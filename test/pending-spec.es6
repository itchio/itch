import test from 'zopf'
import proxyquire from 'proxyquire'

import electron from './stubs/electron'

let setup = (t) => {
  let stubs = electron

  ;['app-store', 'window-store'].forEach((name) => {
    proxyquire(`../app/stores/${name}`, stubs)
  })
}

test('pending specs', t => {
  setup(t)
})
