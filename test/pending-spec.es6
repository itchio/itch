import test from 'zopf'
import proxyquire from 'proxyquire'

import electron from './stubs/electron'

let setup = (t) => {
  let stubs = electron

  ;['main-window', 'menu', 'notifier', 'tray'].forEach((name) => {
    proxyquire(`../app/ui/${name}`, stubs)
  })

  ;['crash-reporter'].forEach((name) => {
    proxyquire(`../app/util/${name}`, stubs)
  })

  proxyquire('../app/components/layout', stubs)
}

test('pending specs', t => {
  setup(t)
})
