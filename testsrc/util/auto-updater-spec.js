
import test from 'zopf'
import proxyquire from 'proxyquire'

import electron from '../stubs/electron'

let setup = t => {
  let os = {}

  let stubs = Object.assign({
    './os': os
  }, electron)

  let updater = proxyquire('../../app/util/auto-updater', stubs)
  return Object.assign({updater, os}, electron)
}

let setup_win32 = t => {
  let os = {}
  let reg = {
    install: async () => null,
    update: async () => null,
    uninstall: async () => null
  }

  let shortcut = {
    install: async () => null,
    update: async () => null,
    uninstall: async () => null
  }

  let stubs = Object.assign({
    '../os': os,
    '../reg': reg,
    '../shortcut': shortcut
  }, electron)

  let win32 = proxyquire('../../app/util/auto-updater/win32', stubs)
  return Object.assign({os, win32}, electron.electron)
}

test('auto-updater', t => {
  t.case('stubbed on darwin', async t => {
    let r = setup(t)
    t.stub(r.os, 'platform').returns('darwin')
    t.false(await r.updater.start(), 'returns false')
  })

  t.case('bypassed on linux', async t => {
    let r = setup(t)
    t.stub(r.os, 'platform').returns('linux')
    t.false(await r.updater.start(), 'returns false')
  })
})

test('auto-updater/win32', t => {
  t.case(`noop if no squirrel command`, async t => {
    let r = setup(t)
    t.stub(r.os, 'platform').returns('win32')
    t.false(await r.updater.start(), 'returns false')
  })

  ;['install', 'updated', 'uninstall', 'obsolete'].forEach((action) => {
    t.case(`quit on ${action}`, async t => {
      let r = setup_win32(t)
      t.stub(r.os, 'cli_args').returns(['hi mom', `--squirrel-${action}`])
      t.true(await r.win32.start(), 'returns true')
    })
  })
})
