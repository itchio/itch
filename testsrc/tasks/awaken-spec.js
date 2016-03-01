
const test = require('zopf')
const proxyquire = require('proxyquire')

const electron = require('../stubs/electron')
const CaveStore = require('../stubs/cave-store')
const CredentialsStore = require('../stubs/credentials-store')

test('awaken', t => {
  let os = {
    itch_platform: () => 'windows',
    '@noCallThru': true
  }

  let stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    '../stores/credentials-store': CredentialsStore,
    '../util/os': os
  }, electron)

  let awaken = proxyquire('../../app/tasks/awaken', stubs)

  let opts = {id: 'kalamazoo'}

  t.case('downloads if not launchable', async t => {
    t.stub(CaveStore, 'find').returns({ launchable: false })
    let err
    try {
      await awaken.start(opts)
    } catch (e) { err = e }
    t.same(err, {type: 'transition', to: 'find-upload', reason: 'not-installed'})
  })

  t.case('checks for update if launchable', async t => {
    t.stub(CaveStore, 'find').returns({ launchable: true })
    let err
    try {
      await awaken.start(opts)
    } catch (e) { err = e }
    t.same(err, {type: 'transition', to: 'check-for-update', reason: 'awakening'})
  })
})
