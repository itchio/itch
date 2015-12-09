'use nodent';'use strict'
let test = require('zopf')
let proxyquire = require('proxyquire')

let electron = require('../stubs/electron')
let http = require('../stubs/http')
let CaveStore = require('../stubs/cave-store')
let CredentialsStore = require('../stubs/credentials-store')

let typical_install = {
  _id: 42,
  upload_id: 11,
  uploads: { '11': { id: 11, size: 512 } }
}

let upload_response = {
  url: 'http://example.org/game.zip'
}

test('download', t => {
  let fs = {
    lstatAsync: () => null
  }
  let client = CredentialsStore.get_current_user()

  let stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    '../stores/credentials-store': CredentialsStore,
    '../util/http': http,
    '../promised/fs': fs
  }, electron)

  let download = proxyquire('../../app/tasks/download', stubs)

  t.case('validates upload_id', t => {
    let install = Object.assign({}, typical_install, {upload_id: 22})
    t.stub(CaveStore, 'find').resolves(install)
    return t.rejects(download.start({id: 42}))
  })

  t.case('validates upload in list', t => {
    return t.rejects(download.start({id: 42}))
  })

  t.case('downloads free game', t => {
    let install = typical_install
    t.stub(CaveStore, 'find').resolves(install)
    t.stub(client, 'download_upload').resolves(upload_response)
    t.stub(fs, 'lstatAsync').rejects()
    return download.start({id: 42})
  })

  t.case('downloads paid game', t => {
    let install = Object.assign({}, typical_install, {key: {id: 'abacus'}})
    t.stub(CaveStore, 'find').resolves(install)
    t.stub(client, 'download_upload_with_key').resolves(upload_response)
    t.stub(fs, 'lstatAsync').rejects()
    return download.start({id: 42})
  })
})
