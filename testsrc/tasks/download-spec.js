
import test from 'zopf'
import proxyquire from 'proxyquire'

import electron from '../stubs/electron'
import butler from '../stubs/butler'
import CaveStore from '../stubs/cave-store'
import CredentialsStore from '../stubs/credentials-store'

const typical_install = {
  id: 'kalamazoo',
  uploads: { '11': { id: 11, size: 512 } }
}

const upload_response = {
  url: 'http://example.org/game.zip'
}

test('download', t => {
  const client = CredentialsStore.get_current_user()
  const emitter = {
    on: () => null
  }

  const stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    '../stores/credentials-store': CredentialsStore,
    '../util/butler': butler
  }, electron)

  const download = proxyquire('../../app/tasks/download', stubs).default

  t.case('validates upload_id', t => {
    let install = Object.assign({}, typical_install, {upload_id: 22})
    t.stub(CaveStore, 'find').returns(install)
    return t.rejects(download.start({id: 'kalamazoo', emitter}))
  })

  t.case('validates upload in list', t => {
    return t.rejects(download.start({id: 'kalamazoo', upload_id: 11, emitter}))
  })

  t.case('downloads free game', async t => {
    let install = typical_install
    t.stub(CaveStore, 'find').returns(install)
    t.stub(client, 'download_upload').resolves(upload_response)
    let err
    try {
      await download.start({id: 'kalamazoo', upload_id: 11, emitter})
    } catch (e) { err = e }
    t.same(err.reason, 'download-finished')
  })

  t.case('downloads paid game', async t => {
    let install = Object.assign({}, typical_install, {key: {id: 'abacus'}})
    t.stub(CaveStore, 'find').returns(install)
    t.stub(client, 'download_upload_with_key').resolves(upload_response)
    let err
    try {
      await download.start({id: 'kalamazoo', upload_id: 11, emitter})
    } catch (e) { err = e }
    t.same(err.reason, 'download-finished')
  })
})
