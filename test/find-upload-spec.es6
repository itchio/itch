import test from 'zopf'
import proxyquire from 'proxyquire'
import assign from 'object-assign'
import Promise from 'bluebird'
import Immutable from 'seamless-immutable'
import sinon from 'sinon'

import fixture from './fixture'
import electron from './stubs/electron'
import app_store from './stubs/app-store'
import install_store from './stubs/install-store'

let uploads_fixture = fixture.api('game/36664/uploads')

let setup = t => {
  let db = {
    find_one: () => Promise.resolve(null)
  }
  let os = {
    itch_platform: () => 'windows',
    '@noCallThru': true
  }

  let stubs = assign({
    '../stores/app-store': app_store,
    '../stores/install-store': install_store,
    '../util/db': db,
    '../util/os': os
  }, electron)

  let find_upload = proxyquire('../app/tasks/find-upload', stubs)
  let client = app_store.get_current_user()
  t.stub(client, 'game_uploads').resolves(uploads_fixture)

  return {find_upload, client, db, os, app_store, install_store}
}

test('find-upload', t => {
  let {find_upload, install_store, client, db} = setup(t)
  let opts = {id: 'kalamazoo'}

  t.case('search for download key', t => {
    t.mock(db).expects('find_one').once().resolves(null)
    return find_upload.start({})
  })

  t.case('use download key', t => {
    t.stub(install_store, 'get_install').resolves({
      key: {id: 'olmec'}
    })
    t.mock(client).expects('download_key_uploads').once().resolves(uploads_fixture)
    return find_upload.start(opts)
  })

  t.case('rejects 0 downloads', t => {
    client.game_uploads.resolves({uploads: []})
    return t.rejects(find_upload.start(opts))
  })

  t.case('prefer zip', t => {
    client.game_uploads.resolves(Immutable({uploads: [
      {id: 11, p_windows: true, filename: 'setup.exe'},
      {id: 22, p_windows: true, filename: 'game.zip'}
    ]}))
    let stub = t.stub(install_store, 'update_install')
    return find_upload.start(opts).then(_ => {
      sinon.assert.calledWith(stub, 'kalamazoo', {upload_id: 22})
    })
  })

  t.case('avoid soundtracks', t => {
    client.game_uploads.resolves(Immutable({uploads: [
      {id: 11, p_windows: true, filename: 'soundtrack.zip'},
      {id: 22, p_windows: true, filename: 'game.zip'}
    ]}))
    let stub = t.stub(install_store, 'update_install')
    return find_upload.start(opts).then(_ => {
      sinon.assert.calledWith(stub, 'kalamazoo', {upload_id: 22})
    })
  })
})
