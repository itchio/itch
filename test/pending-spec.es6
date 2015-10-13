import test from 'zopf'
import proxyquire from 'proxyquire'

proxyquire.noCallThru()

let setup = (t) => {
  let stubs = {
    'app': {
      getVersion: () => 'evergreen',
      getPath: () => 'tmp/',
      '@global': true
    },
    'browser-window': {
      '@global': true
    },
    'menu': {
      '@global': true
    },
    'tray': {
      '@global': true
    },
    'shell': {
      '@global': true
    }
  }

  proxyquire('../app/util/http', stubs)
  proxyquire('../app/util/defer', stubs)
  proxyquire('../app/util/fs', stubs)
  proxyquire('../app/util/glob', stubs)

  proxyquire('../app/tasks/find_upload', stubs)
  proxyquire('../app/tasks/download', stubs)
  proxyquire('../app/tasks/configure', stubs)
  proxyquire('../app/tasks/launch', stubs)
}

test('do not let our coverage report lie that much', t => {
  setup(t)
})
