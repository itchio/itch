import test from 'zopf'
import proxyquire from 'proxyquire'

proxyquire.noCallThru()

let setup = (t) => {
  let stubs = {}
  ;['app', 'browser-window', 'menu', 'tray', 'shell', 'dialog', 'remote'].forEach((stub) => {
    stubs[stub] = { '@global': true }
  })

  stubs.app.getPath = () => './tmp/'
  stubs.app.getVersion = () => '1.0'
  stubs.remote.require = () => null

  ;['main_window', 'menu', 'notifier', 'tray'].forEach((name) => {
    proxyquire(`../app/ui/${name}`, stubs)
  })

  ;['fs', 'glob', 'api', 'crash_reporter'].forEach((name) => {
    proxyquire(`../app/util/${name}`, stubs)
  })

  ;['find_upload', 'download', 'configure', 'launch'].forEach((name) => {
    proxyquire(`../app/tasks/${name}`, stubs)
  })

  ;['forms', 'game_list', 'layout', 'library', 'login', 'misc', 'setup', 'user_panel'].forEach((name) => {
    proxyquire(`../app/components/${name}`, stubs)
  })
}

test('do not let our coverage report lie that much', t => {
  setup(t)
})
