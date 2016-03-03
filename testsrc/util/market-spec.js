
import test from 'zopf'
import proxyquire from 'proxyquire'
import path from 'path'

import electron from '../stubs/electron'
import CredentialsStore from '../stubs/credentials-store'

test('market', t => {
  const sf = test.module({
    exists: async () => false,
    glob: async () => []
  })

  const stubs = Object.assign({
    '../stores/credentials-store': CredentialsStore,
    './sf': sf
  }, electron)

  const market = proxyquire('../../app/util/market', stubs).default
  t.case('computes library dir properly', async t => {
    const user_id = 1234
    const library_dir = path.join(`tmp/userData/users/${user_id}`)

    await market.load(user_id)
    t.same(market.get_library_dir(), library_dir)
  })
})
