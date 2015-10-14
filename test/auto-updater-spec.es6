import test from 'zopf'
import proxyquire from 'proxyquire'
import assign from 'object-assign'

import electron from './stubs/electron'

let setup = t => {
  let os = {}

  let stubs = assign({
    './os': os
  }, electron)

  let updater = proxyquire('../app/util/auto-updater', stubs)
  return assign({updater, os}, electron)
}

test('updater should be bypassed on darwin', t => {
  let {os, updater} = setup(t)
  t.stub(os, 'platform').returns('darwin')
  t.false(updater.run(), 'returns false')
})

test('updater should be bypassed on linux', t => {
  let {os, updater} = setup(t)
  t.stub(os, 'platform').returns('linux')
  t.false(updater.run(), 'returns false')
})

test(`auto-updater/win32 should noop if no squirrel cli args`, t => {
  let {updater} = setup(t)
  t.false(updater.run(), 'returns false')
})

;['install', 'updated', 'uninstall', 'obsolete'].forEach((action) => {
  test(`auto-updater/win32 should quit on ${action}`, t => {
    let {os, app, updater} = setup(t)
    t.stub(os, 'platform').returns('win32')
    t.stub(os, 'cli_args').returns(['hi mom', `--squirrel-${action}`])
    t.mock(app).expects('quit').once()
    t.true(updater.run(), 'returns true')
  })
})
