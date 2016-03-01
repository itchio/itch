
const test = require('zopf')
const proxyquire = require('proxyquire')

const electron = require('../stubs/electron')
const butler = require('../stubs/butler')
const CaveStore = require('../stubs/cave-store')
const CredentialsStore = require('../stubs/credentials-store')

let typical_install = {
  _id: 42,
  uploads: { '11': { id: 11, size: 512 } }
}

let upload_response = {
  url: 'http://example.org/game.zip'
}

test('download', t => {
  let client = CredentialsStore.get_current_user()
  let emitter = {
    on: () => null
  }

  let stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    '../stores/credentials-store': CredentialsStore,
    '../util/butler': butler
  }, electron)

  let download = proxyquire('../../app/tasks/download', stubs)

  t.case('validates upload_id', t => {
    let install = Object.assign({}, typical_install, {upload_id: 22})
    t.stub(CaveStore, 'find').returns(install)
    return t.rejects(download.start({id: 42, emitter}))
  })

  t.case('validates upload in list', t => {
    return t.rejects(download.start({id: 42, upload_id: 11, emitter}))
  })

  t.case('downloads free game', async t => {
    let install = typical_install
    t.stub(CaveStore, 'find').returns(install)
    t.stub(client, 'download_upload').resolves(upload_response)
    let err
    try {
      await download.start({id: 42, upload_id: 11, emitter})
    } catch (e) { err = e }
    t.same(err.reason, 'download-finished')
  })

  t.case('downloads paid game', async t => {
    let install = Object.assign({}, typical_install, {key: {id: 'abacus'}})
    t.stub(CaveStore, 'find').returns(install)
    t.stub(client, 'download_upload_with_key').resolves(upload_response)
    let err
    try {
      await download.start({id: 42, upload_id: 11, emitter})
    } catch (e) { err = e }
    t.same(err.reason, 'download-finished')
  })
})
