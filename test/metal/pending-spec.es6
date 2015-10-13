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

  t.require('../../app/util/http', stubs)
  t.require('../../app/util/defer', stubs)
  t.require('../../app/util/fs', stubs)
  t.require('../../app/util/glob', stubs)

  t.require('../../app/tasks/find_upload', stubs)
  t.require('../../app/tasks/download', stubs)
  t.require('../../app/tasks/configure', stubs)
  t.require('../../app/tasks/launch', stubs)
}

test('do not let our coverage report lie that much', t => {
  setup(t)
})
