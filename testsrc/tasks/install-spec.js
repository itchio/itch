
import test from 'zopf'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

import fixture from '../fixture'
import electron from '../stubs/electron'
import CaveStore from '../stubs/cave-store'
import AppActions from '../stubs/app-actions'

const typical_install = {
  id: 'kalamazoo',
  uploads: {'11': {id: 11, size: 512}}
}

test('install', t => {
  const archive = test.module({
    install: () => 0
  })

  const core_stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    '../actions/app-actions': AppActions,
    './archive': archive
  }, electron)

  const install_core = proxyquire('../../app/tasks/install/core', core_stubs).default

  ;['zip', 'gz', 'bz2', '7z'].forEach((type) => {
    t.case(`use 7-zip on ${type}`, t => {
      t.mock(archive).expects('install').once().resolves()

      return install_core.install({
        archive_path: fixture.path(type),
        dest_path: '/tmp/dest',
        upload_id: 999
      })
    })
  })

  // 'empty' cannot be sniffed, 'png' can be sniffed but
  // isn't a valid archive type (hopefully)
  ;['empty', 'png'].forEach((type) => {
    t.case(`admit own limits (${type})`, t => {
      const spy = t.spy()
      const install_opts = {
        archive_path: fixture.path(type),
        dest_path: '/tmp/dest',
        upload_id: 999
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

  const sf = test.module({
    lstat: async () => ({mtime: new Date(123)})
  })

  const stubs = Object.assign({
    './install/core': install_core,
    '../util/sf': sf
  }, core_stubs)
  const install = proxyquire('../../app/tasks/install', stubs).default

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
    const uptodate_install = Object.assign({}, typical_install, {
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
