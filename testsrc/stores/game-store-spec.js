
let test = require('zopf')
let sinon = require('sinon')
let proxyquire = require('proxyquire')

let AppConstants = require('../../app/constants/app-constants')

let electron = require('../stubs/electron')
let AppDispatcher = require('../stubs/app-dispatcher')
let AppActions = require('../stubs/app-actions')
let CredentialsStore = require('../stubs/credentials-store')

let db = require('../stubs/db')

test('GameStore', t => {
  let stubs = Object.assign({
    './credentials-store': CredentialsStore,
    '../actions/app-actions': AppActions,
    '../dispatcher/app-dispatcher': AppDispatcher,
    '../util/db': db
  }, electron)

  t.stub(CredentialsStore, 'get_me').resolves({id: 'gurn'})

  proxyquire('../../app/stores/game-store', stubs)
  let handler = AppDispatcher.get_handler('game-store')

  t.case('fetch owned', async t => {
    let mock = t.mock(CredentialsStore.get_current_user())

    mock.expects(`my_owned_keys`).twice()
      .onFirstCall().resolves({owned_keys: [1, 2, 3]})
      .onSecondCall().resolves({owned_keys: []})

    await handler({ action_type: AppConstants.FETCH_GAMES, path: 'owned' })
  })

  t.case('fetch installed', async t => {
    await handler({ action_type: AppConstants.FETCH_GAMES, path: 'installed' })
    handler({ action_type: AppConstants.INSTALL_PROGRESS, opts: {id: 12} })
  })

  t.case('fetch dashboard', async t => {
    let mock = t.mock(CredentialsStore.get_current_user())
    mock.expects('my_games').resolves({games: [{}, {}, {}]})
    await handler({ action_type: AppConstants.FETCH_GAMES, path: 'dashboard' })
  })

  t.case('fetch install', async t => {
    t.stub(db, 'find_cave').resolves({game_id: 64})
    await handler({ action_type: AppConstants.FETCH_GAMES, path: 'installs/46' })
  })

  t.case('fetch collections', async t => {
    t.stub(db, 'find_collection').resolves({game_ids: [1, 2, 3, 4, 5]})
    let user = CredentialsStore.get_current_user()
    let collection_games = t.stub(user, 'collection_games')
    collection_games.onCall(0).resolves({
      total_items: 5, per_page: 3, page: 1,
      games: [1, 3, 5].map((id) => ({id}))
    })
    collection_games.onCall(1).resolves({
      total_items: 5, per_page: 3, page: 2,
      games: [7, 9].map((id) => ({id}))
    })

    let update = t.stub(db, 'update').resolves()
    await handler({ action_type: AppConstants.FETCH_GAMES, path: 'collections/78' })
    sinon.assert.calledWith(update, {_table: 'collections', id: 78}, {$set: {game_ids: [1, 3, 5, 7, 9], _fetched_at: sinon.match.date}})
  })
})
