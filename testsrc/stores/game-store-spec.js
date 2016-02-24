
let test = require('zopf')
let proxyquire = require('proxyquire')

let AppConstants = require('../../app/constants/app-constants')

let electron = require('../stubs/electron')
let AppDispatcher = require('../stubs/app-dispatcher')
let AppActions = require('../stubs/app-actions')
let CredentialsStore = require('../stubs/credentials-store')
let market = require('../stubs/market')

import { pluck, indexBy } from 'underline'

test('GameStore', t => {
  let stubs = Object.assign({
    './credentials-store': CredentialsStore,
    '../actions/app-actions': AppActions,
    '../dispatcher/app-dispatcher': AppDispatcher,
    '../util/market': market
  }, electron)

  t.stub(CredentialsStore, 'get_me').returns({id: 123})

  const GameStore = proxyquire('../../app/stores/game-store', stubs)
  const handler = AppDispatcher.get_handler('game-store')

  t.case('fetch dashboard', async t => {
    let bag = {
      games: [
        { id: 1, name: 'Mine', user_id: 123 },
        { id: 2, name: 'Theirs', user_id: 4209 },
        { id: 3, name: 'Also mine', user_id: 123 }
      ]::indexBy('id')
    }
    t.stub(market, 'get_entities', (x) => bag[x])
    handler({ action_type: AppConstants.FETCH_GAMES, path: 'dashboard' })

    t.same(GameStore.get_state()['dashboard']::pluck('id'), [1, 3])
  })

  t.case('fetch owned', async t => {
    let bag = {
      games: [
        { id: 1, name: 'Mine', user_id: 123 },
        { id: 2, name: 'Theirs', user_id: 4209 },
        { id: 3, name: 'Also mine', user_id: 123 }
      ]::indexBy('id'),
      download_keys: [
        { id: 23498, game_id: 4209 }
      ]::indexBy('id')
    }
    t.stub(market, 'get_entities', (x) => bag[x])

    handler({ action_type: AppConstants.FETCH_GAMES, path: 'owned' })
    t.same(GameStore.get_state()['dashboard']::pluck('id'), [1, 3])
  })

  t.case('fetch collection games', async t => {
    let bag = {
      collections: [
        { id: 2340, name: 'The grittiest', game_ids: [123, 456, 789] }
      ]::indexBy('id'),
      games: [
        { id: 123, name: 'Good', user_id: 3 },
        { id: 456, name: 'Better', user_id: 3 },
        { id: 789, name: 'None', user_id: 3 }
      ]::indexBy('id')
    }
    t.stub(market, 'get_entities', (x) => bag[x])

    handler({ action_type: AppConstants.FETCH_GAMES, path: 'collections/2340' })
    t.same(GameStore.get_state()['collections/2340']::pluck('id'), [123, 456, 789])
  })
})
