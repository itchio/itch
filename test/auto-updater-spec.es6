import test from 'zopf'
import proxyquire from 'proxyquire'

import electron from './stubs/electron'

let setup = t => {
  let os = {}

  let stubs = Object.assign({
    './os': os
  }, electron)

  let updater = proxyquire('../app/util/auto-updater', stubs)
  return Object.assign({updater, os}, electron)
}

test('auto-updater', t => {
  t.case('stubbed on darwin', t => {
    let {os, updater} = setup(t)
    t.stub(os, 'platform').returns('darwin')
    t.false(updater.run(), 'returns false')
  })

  t.case('bypassed on linux', t => {
    let {os, updater} = setup(t)
    t.stub(os, 'platform').returns('linux')
    t.false(updater.run(), 'returns false')
  })
})

test('auto-updater/win32', t => {
  t.case(`noop if no squirrel command`, t => {
    let {os, updater} = setup(t)
    t.stub(os, 'platform').returns('win32')
    t.false(updater.run(), 'returns false')
  })

  ;['install', 'updated', 'uninstall', 'obsolete'].forEach((action) => {
    t.case(`quit on ${action}`, t => {
      let {os, app, updater} = setup(t)
      t.stub(os, 'platform').returns('win32')
      t.stub(os, 'cli_args').returns(['hi mom', `--squirrel-${action}`])
      t.mock(app).expects('quit').once()
      t.true(updater.run(), 'returns true')
    })
  })
})
