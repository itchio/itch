'use strict'

let test = require('zopf')
let proxyquire = require('proxyquire')

let electron = require('../stubs/electron')

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
    uninstall: async () => null
  }

  let stubs = Object.assign({
    '../os': os,
    '../reg': reg
  }, electron)

  let win32 = proxyquire('../../app/util/auto-updater/win32', stubs)
  return Object.assign({os, win32}, electron.electron)
}

test('auto-updater', t => {
  t.case('stubbed on darwin', t => {
    let r = setup(t)
    t.stub(r.os, 'platform').returns('darwin')
    Promise.resolve(r.updater.start()).then((r) => {
      t.false(r, 'returns false')
    })
  })

  t.case('bypassed on linux', t => {
    let r = setup(t)
    t.stub(r.os, 'platform').returns('linux')
    Promise.resolve(r.updater.start()).then((r) => {
      t.false(r, 'returns false')
    })
  })
})

test('auto-updater/win32', t => {
  t.case(`noop if no squirrel command`, t => {
    let r = setup(t)
    t.stub(r.os, 'platform').returns('win32')
    Promise.resolve(r.updater.start()).then((r) => {
      t.false(r, 'returns false')
    })
  })

  ;['install', 'updated', 'uninstall', 'obsolete'].forEach((action) => {
    t.case(`quit on ${action}`, t => {
      let r = setup_win32(t)
      t.stub(r.os, 'cli_args').returns(['hi mom', `--squirrel-${action}`])
      Promise.resolve(r.win32.start()).then((r) => {
        t.true(r, 'returns true')
      })
    })
  })
})
