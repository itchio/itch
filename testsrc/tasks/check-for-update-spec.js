
let test = require('zopf')
let proxyquire = require('proxyquire')

let electron = require('../stubs/electron')
let CaveStore = require('../stubs/cave-store')
let CredentialsStore = require('../stubs/credentials-store')

test('check-for-update', t => {
  let find_upload = {
    start: async () => null,
    '@noCallThru': true
  }
  let os = {
    itch_platform: () => 'windows',
    '@noCallThru': true
  }

  let uploads = [
    {id: 55, p_windows: true, filename: 'setup.exe'},
    {id: 66, p_windows: true, filename: 'game.zip'}
  ]

  let stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    '../stores/credentials-store': CredentialsStore,
    './find-upload': find_upload,
    '../util/os': os
  }, electron)

  let check_for_update = proxyquire('../../app/tasks/check-for-update', stubs)

  let opts = {id: 'kalamazoo'}

  t.case('redownloads if has a fresher download', async t => {
    let transition = {type: 'transition', to: 'download', reason: 'upload-found', data: {upload_id: 78}}
    t.stub(CaveStore, 'find').returns({ uploads, upload_id: 66, launchable: true })
    t.stub(find_upload, 'start').rejects(transition)

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
