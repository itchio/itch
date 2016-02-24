
let test = require('zopf')
let proxyquire = require('proxyquire')
let sinon = require('sinon')

let fixture = require('../fixture')
let electron = require('../stubs/electron')
let CaveStore = require('../stubs/cave-store')
let AppActions = require('../stubs/app-actions')

let typical_install = {
  _id: 42,
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

  let sf = {
    lstat: async () => ({mtime: new Date(123)})
  }
  stubs = Object.assign({
    './install/core': install_core,
    '../util/sf': sf
  }, stubs)
  let install = proxyquire('../../app/tasks/install', stubs)

  t.case(`validate upload_id`, async t => {
    t.stub(CaveStore, 'find').returns({})
    let err
    try {
      await install.start({id: 42})
    } catch (e) { err = e }
    t.same(err, {type: 'transition', to: 'find-upload', reason: 'need upload id'})
  })

  t.case(`task should start`, async t => {
    t.stub(CaveStore, 'find').returns(typical_install)
    t.mock(install_core).expects('install').resolves()
    let err
    try {
      await install.start({id: 42, upload_id: 11})
    } catch (e) { err = e }
    t.same(err, {type: 'transition', to: 'configure', reason: 'installed'})
  })

  t.case(`validate archive presence`, async t => {
    t.stub(CaveStore, 'find').returns(typical_install)
    t.stub(sf, 'lstat').rejects('ENOENT and whatnot')
    let err
    try {
      await install.start({id: 42, upload_id: 11})
    } catch (e) { err = e }
    t.same(err, {type: 'transition', to: 'download', reason: 'missing-download'})
  })

  t.case(`does nothing when up to date`, async t => {
    let uptodate_install = Object.assign({}, typical_install, {
      upload_id: 11,
      installed_archive_mtime: new Date(123)
    })
    t.stub(CaveStore, 'find').returns(uptodate_install)

    let err
    try {
      await install.start({id: 42, upload_id: 11})
    } catch (e) { err = e }
    t.same(err, {type: 'transition', to: 'idle', reason: 'up-to-date'})
  })
})
