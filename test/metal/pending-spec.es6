import test from 'zopf'

let setup = (t) => {
  let stubs = {
    'app': {
      getVersion: () => 'evergreen',
      getPath: () => 'tmp/',
      '@global': true,
      '@noCallThru': true
    },
    'browser-window': { '@global': true },
    'menu': { '@global': true },
    'tray': { '@global': true },
    'shell': { '@global': true }
  }

  t.require('../../metal/util/http', stubs)
  t.require('../../metal/util/defer', stubs)
  t.require('../../metal/util/fs', stubs)
  t.require('../../metal/util/glob', stubs)

  t.require('../../metal/tasks/find_upload', stubs)
  t.require('../../metal/tasks/download', stubs)
  t.require('../../metal/tasks/configure', stubs)
  t.require('../../metal/tasks/launch', stubs)
}

test('do not let our coverage report lie that much', t => {
  setup(t)
})
