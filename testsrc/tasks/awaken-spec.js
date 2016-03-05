
import test from 'zopf'
import proxyquire from 'proxyquire'

import electron from '../stubs/electron'
import CaveStore from '../stubs/cave-store'
import CredentialsStore from '../stubs/credentials-store'

test('awaken', t => {
  const os = test.module({
    itch_platform: () => 'windows'
  })

  const stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    '../stores/credentials-store': CredentialsStore,
    '../util/os': os
  }, electron)

  const awaken = proxyquire('../../app/tasks/awaken', stubs).default

  const opts = {id: 'kalamazoo'}

  t.case('downloads if not launchable', async t => {
    t.stub(CaveStore, 'find').returns({launchable: false})
    let err
    try {
      await awaken.start(opts)
    } catch (e) { err = e }
    t.same(err, {type: 'transition', to: 'find-upload', reason: 'not-installed'})
  })

  t.case('checks for update if launchable', async t => {
    t.stub(CaveStore, 'find').returns({launchable: true})
    let err
    try {
      await awaken.start(opts)
    } catch (e) { err = e }
    t.same(err, {type: 'transition', to: 'check-for-update', reason: 'awakening'})
  })
})
