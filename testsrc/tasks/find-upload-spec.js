
import test from 'zopf'
import proxyquire from 'proxyquire'
import {indexBy} from 'underline'

import fixture from '../fixture'
import electron from '../stubs/electron'
import CaveStore from '../stubs/cave-store'
import CredentialsStore from '../stubs/credentials-store'
import AppActions from '../stubs/app-actions'
import market from '../stubs/market'

let uploads_fixture = fixture.api('game/36664/uploads')

test('find-upload', t => {
  const os = test.module({
    itch_platform: () => 'windows'
  })

  const stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    '../stores/credentials-store': CredentialsStore,
    '../actions/app-actions': AppActions,
    '../util/market': market,
    '../util/os': os
  }, electron)

  const find_upload = proxyquire('../../app/tasks/find-upload', stubs).default
  const client = CredentialsStore.get_current_user()
  t.stub(client, 'game_uploads').resolves(uploads_fixture)

  const opts = {id: 'kalamazoo'}

  const picks_upload = async (t, upload_id) => {
    let err
    try {
      await find_upload.start(opts)
    } catch (e) { err = e }
    t.same(err, {type: 'transition', to: 'download', reason: 'found-upload', data: {upload_id}}, `picked upload ${upload_id}`)
  }

  const transitions = async (t, opts) => {
    let err
    try {
      await find_upload.start(opts)
    } catch (e) { err = e }
    t.same(err.type, 'transition', 'transitioned')
    t.same(err.to, 'download', 'transitioned to download')
  }

  t.case('seeks download key', async t => {
    const bag = {
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
    const bag = {
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
