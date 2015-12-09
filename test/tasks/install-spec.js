'use nodent';'use strict'
import test from 'zopf'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

import fixture from '../fixture'
import electron from '../stubs/electron'
import CaveStore from '../stubs/cave-store'
import AppActions from '../stubs/app-actions'

let typical_install = {
  _id: 42,
  upload_id: 11,
  uploads: { '11': { id: 11, size: 512 } }
}

let setup = (t) => {
  let archive = {
    install: () => 0,
    '@noCallThru': true
  }

  let stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    '../actions/app-actions': AppActions,
    './installers/archive': archive
  }, electron)
  let install = proxyquire('../../app/tasks/install', stubs)
  return {CaveStore, archive, install}
}

test('install', t => {
  let {archive, install, CaveStore} = setup(t)

  ;['zip', 'gz', 'bz2', '7z'].forEach((type) => {
    t.case(`use 7-zip on ${type}`, t => {
      t.mock(archive).expects('install').once().resolves()

      return install.install({
        archive_path: fixture.path(type),
        dest_path: '/tmp'
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
        dest_path: '/tmp'
      }

      return install.install(install_opts).catch(spy).finally(() => {
        sinon.assert.calledWith(spy, sinon.match.has('message', sinon.match(/don't know how/)))
      })
    })
  })

  t.case(`validate upload_id`, t => {
    t.stub(CaveStore, 'find').resolves({})
    return t.rejects(install.start({id: 42}))
  })

  t.case(`task should start`, t => {
    t.stub(CaveStore, 'find').resolves(typical_install)
    t.mock(install).expects('install').resolves()
    return install.start({id: 42})
  })
})
