
let test = require('zopf')
let proxyquire = require('proxyquire')

import { indexBy } from 'underline'

let fixture = require('../fixture')
let electron = require('../stubs/electron')
let CaveStore = require('../stubs/cave-store')
let CredentialsStore = require('../stubs/credentials-store')
let AppActions = require('../stubs/app-actions')
let db = require('../stubs/db')
let market = require('../stubs/market')

let uploads_fixture = fixture.api('game/36664/uploads')

test('find-upload', t => {
  let os = {
    itch_platform: () => 'windows',
    '@noCallThru': true
  }

  let stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    '../stores/credentials-store': CredentialsStore,
    '../actions/app-actions': AppActions,
    '../util/market': market,
    '../util/db': db,
    '../util/os': os
  }, electron)

  let find_upload = proxyquire('../../app/tasks/find-upload', stubs)
  let client = CredentialsStore.get_current_user()
  t.stub(client, 'game_uploads').resolves(uploads_fixture)

  let opts = {id: 'kalamazoo'}

  let picks_upload = async (t, upload_id) => {
    let err
    try {
      await find_upload.start(opts)
    } catch (e) { err = e }
    t.same(err, {type: 'transition', to: 'download', reason: 'found-upload', data: {upload_id}}, `picked upload ${upload_id}`)
  }

  let transitions = async (t, opts) => {
    let err
    try {
      await find_upload.start(opts)
    } catch (e) { err = e }
    t.same(err.type, 'transition', 'transitioned')
    t.same(err.to, 'download', 'transitioned to download')
  }

  t.case('seeks download key', async t => {
    let bag = {
      download_keys: [
        { id: 1, game_id: 84 }
      ]::indexBy('id'),
      games: [
        { id: 84, title: 'Yeehaw' }
      ]::indexBy('id')
    }
    t.stub(market, 'get_entities', (x) => bag[x])

    t.stub(CaveStore, 'find').returns({ game_id: 84 })
    t.mock(client).expects('download_key_uploads').once().resolves(uploads_fixture)
    await transitions(t, opts)
  })

  t.case('uses download key', async t => {
    let bag = {
      games: [
        { id: 84, title: 'Yeehaw' }
      ]::indexBy('id')
    }
    t.stub(market, 'get_entities', (x) => bag[x])

    t.stub(CaveStore, 'find').returns({
      key: {id: 'olmec'}
    })
    t.mock(client).expects('download_key_uploads').once().resolves(uploads_fixture)
    await transitions(t, opts)
  })

  t.case('rejects 0 downloads', async t => {
    client.game_uploads.resolves({uploads: []})
    await t.rejects(find_upload.start(opts))
  })

  t.case('rejects 0 downloads for platform', async t => {
    client.game_uploads.resolves({uploads: [
      {id: 11, filename: 'setup.dmg'}
    ]})
    await t.rejects(find_upload.start(opts))
  })

  t.case('prefer zip', async t => {
    client.game_uploads.resolves({uploads: [
      {id: 11, p_windows: true, filename: 'setup.exe'},
      {id: 22, p_windows: true, filename: 'game.zip'}
    ]})
    await picks_upload(t, 22)
  })

  t.case('avoid soundtracks', async t => {
    client.game_uploads.resolves({uploads: [
      {id: 11, p_windows: true, filename: 'game.zip'},
      {id: 22, p_windows: true, filename: 'soundtrack.zip'}
    ]})
    await picks_upload(t, 11)
  })

  t.case('avoid deb/rpm', async t => {
    client.game_uploads.resolves({uploads: [
      {id: 11, p_windows: true, filename: 'game.deb'},
      {id: 22, p_windows: true, filename: 'game.rpm'},
      {id: 33, p_windows: true, filename: 'game.zip'}
    ]})
    await picks_upload(t, 33)
  })
})
