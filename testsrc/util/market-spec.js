
let test = require('zopf')
let proxyquire = require('proxyquire')
import { indexBy, pluck } from 'underline'

let electron = require('../stubs/electron')
let CredentialsStore = require('../stubs/credentials-store')

test('Market', t => {
  const app = {
    '@noCallThru': true,
    getPath: () => 'test/tmp'
  }

  const stubs = Object.assign({
    '../stores/credentials-store': CredentialsStore,
    './app': app
  }, electron)
  const market = proxyquire('../../app/util/market', stubs)
  market._state.library_dir = 'test/tmp/users/foobar'

  const fetch = proxyquire('../../app/util/fetch', stubs)

  let api = CredentialsStore.get_current_user()

  t.case('fetch collections', async t => {
    market.clear()
    let featured_ids = [23]

    t.stub(api, 'my_collections').resolves({
      collections: [
        { id: 78 },
        { id: 97 }
      ]
    })
    t.stub(api, 'collection').resolves({
      collection: { id: 23 }
    })

    let cb = t.spy()
    await fetch.collections(market, featured_ids, cb)

    t.same(cb.callCount, 3)
    t.sameSet(market.get_entities('collections')::pluck('id'), [23, 78, 97])
  })

  t.case('fetch dashboard games', async t => {
    market.clear()
    t.stub(api, 'my_games').resolves({
      games: [ { id: 234, name: 'Peter Pan' } ]
    })

    let cb = t.spy()
    await fetch.dashboard_games(market, cb)

    t.same(cb.callCount, 2)
    t.same(market.get_entities('games'), {
      '234': {
        id: 234,
        user_id: 123,
        name: 'Peter Pan'
      }
    })
  })

  t.case('fetch owned keys', async t => {
    market.clear()
    let stub = t.stub(api, 'my_owned_keys')
    stub.onFirstCall().resolves({
      owned_keys: [
        {
          id: 456,
          game: {
            '999': {
              id: 999,
              user_id: 432,
              name: 'Hoodwink'
            }
          }
        }
      ]
    })
    stub.onSecondCall().resolves({
      owned_keys: []
    })

    let cb = t.spy()
    await fetch.owned_keys(market, cb)

    t.equal(stub.callCount, 2)
    t.equal(cb.callCount, 2)
    t.same(market.get_entities('download_keys')::pluck('id'), [456])
  })

  t.case('fetch collection games', async t => {
    market.clear()
    market.save_all_entities({
      entities: {
        collections: [
          { id: 8712, game_ids: [9, 12, 87] }
        ]::indexBy('id')
      }
    })

    const collection_games = t.stub(api, 'collection_games')
    collection_games.onCall(0).resolves({
      total_items: 5, per_page: 3, page: 1,
      games: [1, 3, 5].map((id) => ({id}))
    })
    collection_games.onCall(1).resolves({
      total_items: 5, per_page: 3, page: 2,
      games: [7, 9].map((id) => ({id}))
    })

    let cb = t.spy()
    await fetch.collection_games(market, 8712, cb)

    t.equal(cb.callCount, 4)
    const collection = market.get_entities('collections')[8712].game_ids
    t.sameSet(collection, [1, 3, 5, 7, 9])
  })
})
