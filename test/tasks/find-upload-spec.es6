import test from 'zopf'
import proxyquire from 'proxyquire'
import Promise from 'bluebird'
import sinon from 'sinon'

import fixture from '../fixture'
import electron from '../stubs/electron'
import InstallStore from '../stubs/install-store'
import CredentialsStore from '../stubs/credentials-store'
import AppActions from '../stubs/app-actions'

let uploads_fixture = fixture.api('game/36664/uploads')

let setup = t => {
  let db = {
    find_one: () => Promise.resolve(null)
  }
  let os = {
    itch_platform: () => 'windows',
    '@noCallThru': true
  }

  let stubs = Object.assign({
    '../stores/install-store': InstallStore,
    '../stores/credentials-store': CredentialsStore,
    '../actions/app-actions': AppActions,
    '../util/db': db,
    '../util/os': os
  }, electron)

  let find_upload = proxyquire('../../app/tasks/find-upload', stubs)
  let client = CredentialsStore.get_current_user()
  t.stub(client, 'game_uploads').resolves(uploads_fixture)

  return {find_upload, client, db, InstallStore, AppActions}
}

test('find-upload', t => {
  let {find_upload, client, db, InstallStore, AppActions} = setup(t)
  let opts = {id: 'kalamazoo'}

  t.case('search for download key', t => {
    t.mock(db).expects('find_one').once().resolves(null)
    return find_upload.start({})
  })

  t.case('use download key', t => {
    t.stub(InstallStore, 'get_install').resolves({
      key: {id: 'olmec'}
    })
    t.mock(client).expects('download_key_uploads').once().resolves(uploads_fixture)
    return find_upload.start(opts)
  })

  t.case('rejects 0 downloads', t => {
    client.game_uploads.resolves({uploads: []})
    return t.rejects(find_upload.start(opts))
  })

  t.case('rejects 0 downloads for platform', t => {
    client.game_uploads.resolves({uploads: [
      {id: 11, filename: 'setup.dmg'}
    ]})
    return t.rejects(find_upload.start(opts))
  })

  t.case('prefer zip', t => {
    client.game_uploads.resolves({uploads: [
      {id: 11, p_windows: true, filename: 'setup.exe'},
      {id: 22, p_windows: true, filename: 'game.zip'}
    ]})
    let stub = t.stub(AppActions, 'install_update')
    return find_upload.start(opts).then(_ => {
      sinon.assert.calledWith(stub, 'kalamazoo', {upload_id: 22})
    })
  })

  t.case('avoid soundtracks', t => {
    client.game_uploads.resolves({uploads: [
      {id: 11, p_windows: true, filename: 'soundtrack.zip'},
      {id: 22, p_windows: true, filename: 'game.zip'}
    ]})
    let stub = t.stub(AppActions, 'install_update')
    return find_upload.start(opts).then(_ => {
      sinon.assert.calledWith(stub, 'kalamazoo', {upload_id: 22})
    })
  })
})
