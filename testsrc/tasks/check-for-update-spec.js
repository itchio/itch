
import test from 'zopf'
import proxyquire from 'proxyquire'

import electron from '../stubs/electron'
import CaveStore from '../stubs/cave-store'
import CredentialsStore from '../stubs/credentials-store'

test('check-for-update', t => {
  const find_upload = test.module({
    start: async () => null
  })
  const os = test.module({
    itch_platform: () => 'windows'
  })

  const uploads = [
    {id: 55, p_windows: true, filename: 'setup.exe'},
    {id: 66, p_windows: true, filename: 'game.zip'}
  ]

  const stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    '../stores/credentials-store': CredentialsStore,
    './find-upload': find_upload,
    '../util/os': os
  }, electron)

  const check_for_update = proxyquire('../../app/tasks/check-for-update', stubs).default

  const opts = {id: 'kalamazoo'}

  t.case('redownloads if has a fresher download', async t => {
    const transition = {type: 'transition', to: 'download', reason: 'upload-found', data: {upload_id: 78}}
    t.stub(CaveStore, 'find').returns({uploads, upload_id: 66, launchable: true})
    t.stub(find_upload.default, 'start').rejects(transition)

    let err
    try {
      await check_for_update.start(opts)
    } catch (e) { err = e }
    t.same(err, transition)
  })

  t.case('does not redownload when up to date', async t => {
    t.stub(CaveStore, 'find').returns({
      uploads,
      upload_id: 66,
      launchable: true
    })
    await check_for_update.start(opts)
  })
})
