'use strict'

let test = require('zopf')
let proxyquire = require('proxyquire')
let sinon = require('sinon')

let fixture = require('../fixture')
let electron = require('../stubs/electron')
let CaveStore = require('../stubs/cave-store')
let AppActions = require('../stubs/app-actions')

let typical_install = {
  _id: 42,
  upload_id: 11,
  uploads: { '11': { id: 11, size: 512 } }
}

test('install', t => {
  let archive = {
    install: () => 0,
    '@noCallThru': true
  }

  let stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    '../actions/app-actions': AppActions,
    './archive': archive
  }, electron)
  let install_core = proxyquire('../../app/tasks/install/core', stubs)

  ;['zip', 'gz', 'bz2', '7z'].forEach((type) => {
    t.case(`use 7-zip on ${type}`, t => {
      t.mock(archive).expects('install').once().resolves()

      return install_core.install({
        archive_path: fixture.path(type),
        dest_path: '/tmp/dest'
      })
    })
  })

  // 'empty' cannot be sniffed, 'png' can be sniffed but
  // isn't a valid archive type (hopefully)
  ;['empty', 'png'].forEach((type) => {
    t.case(`admit own limits (${type})`, t => {
      let spy = t.spy()
      let install_opts = {
        archive_path: fixture.path(type),
        dest_path: '/tmp/dest'
      }

      return async function () {
        try {
          await install_core.install(install_opts)
        } catch (e) {
          spy(e)
        }
        sinon.assert.calledWith(spy, sinon.match.has('message', sinon.match(/don't know how/)))
      }
    })
  })

  stubs = Object.assign({
    './install/core': install_core
  }, stubs)
  let install = proxyquire('../../app/tasks/install', stubs)

  t.case(`validate upload_id`, t => {
    t.stub(CaveStore, 'find').resolves({})
    return t.rejects(install.start({id: 42}))
  })

  t.case(`task should start`, t => {
    t.stub(CaveStore, 'find').resolves(typical_install)
    t.mock(install_core).expects('install').resolves()
    return install.start({id: 42})
  })
})
