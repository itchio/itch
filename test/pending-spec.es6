import test from 'zopf'
import proxyquire from 'proxyquire'

let setup = (t) => {
  let stubs = proxyquire('./stubs/electron', {})

  ;['main_window', 'menu', 'notifier', 'tray'].forEach((name) => {
    proxyquire(`../app/ui/${name}`, stubs)
  })

  ;['crash-reporter'].forEach((name) => {
    proxyquire(`../app/util/${name}`, stubs)
  })

  ;['find-upload', 'configure', 'launch'].forEach((name) => {
    proxyquire(`../app/tasks/${name}`, stubs)
  })

  proxyquire('../app/components/layout', stubs)
}

if (process.env.TRAVIS) {
  test('do not let our coverage report lie that much', t => {
    setup(t)
  })
}
