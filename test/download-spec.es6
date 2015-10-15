import test from 'zopf'
import proxyquire from 'proxyquire'
import assign from 'object-assign'
import Immutable from 'seamless-immutable'
import Promise from 'bluebird'

import http from './stubs/http'
import app_store from './stubs/app-store'
import install_store from './stubs/install-store'
import electron from './stubs/electron'

let typical_install = Immutable({
  _id: 42,
  upload_id: 11,
  uploads: { '11': { id: 11, size: 512 } }
})

let upload_response = Immutable({
  url: 'http://example.org/game.zip'
})

let setup = (t) => {
  let fs = {
    lstatAsync: () => Promise.reject()
  }
  let client = app_store.get_current_user()

  let stubs = assign({
    '../stores/install-store': install_store,
    '../stores/app-store': app_store,
    '../util/http': http,
    '../util/fs': fs
  }, electron)

  let download = proxyquire('../app/tasks/download', stubs)
  return {download, client, fs, http}
}

test('download validates upload_id', t => {
  let {download} = setup(t)
  let install = typical_install.merge({upload_id: 22})
  t.stub(install_store, 'get_install').resolves(install)
  return t.rejects(download.start({id: 42}))
})

test('download validates upload in list', t => {
  let {download} = setup(t)
  return t.rejects(download.start({id: 42}))
})

test('download downloads free game', t => {
  let {download, client} = setup(t)
  let install = typical_install
  t.stub(install_store, 'get_install').resolves(install)
  t.stub(client, 'download_upload').resolves(upload_response)
  return download.start({id: 42})
})

test('download downloads paid game', t => {
  let {download, client} = setup(t)
  let install = typical_install.merge({key: {id: 'abacus'}})
  t.stub(install_store, 'get_install').resolves(install)
  t.stub(client, 'download_upload_with_key').resolves(upload_response)
  return download.start({id: 42})
})

test('download skips if already complete', t => {
  let {download, client, fs} = setup(t)
  t.stub(install_store, 'get_install').resolves(typical_install)
  t.stub(client, 'download_upload').resolves(upload_response)
  t.stub(fs, 'lstatAsync').resolves({size: 512})
  return t.rejects(download.start({id: 42}))
})

test('download resumes', t => {
  let {download, client, fs, http} = setup(t)
  t.stub(install_store, 'get_install').resolves(typical_install)
  t.stub(client, 'download_upload').resolves(upload_response)
  t.stub(fs, 'lstatAsync').resolves({size: 256})
  let mock = t.mock(http)
  mock.expects('request').calledWith({})
  return download.start({id: 42})
})
