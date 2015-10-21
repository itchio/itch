import test from 'zopf'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import Immutable from 'seamless-immutable'

import AppConstants from '../../app/constants/app-constants'

import electron from '../stubs/electron'
import AppDispatcher from '../stubs/app-dispatcher'
import AppActions from '../stubs/app-actions'
import CredentialsStore from '../stubs/credentials-store'

import db from '../stubs/db'

test('GameStore', t => {
  let stubs = Object.assign({
    './credentials-store': CredentialsStore,
    '../actions/app-actions': AppActions,
    '../dispatcher/app-dispatcher': AppDispatcher,
    '../util/db': db
  }, electron)

  t.stub(CredentialsStore, 'get_me').resolves({id: 'gurn'})

  let GameStore = proxyquire('../../app/stores/game-store', stubs)
  let handler = AppDispatcher.get_handler(GameStore)

  t.case('fetch owned', t => {
    let mock = t.mock(CredentialsStore.get_current_user())
    mock.expects('my_owned_keys').resolves({owned_keys: [1, 2, 3]})
    mock.expects('my_claimed_keys').resolves({claimed_keys: [1, 2, 3]})
    return handler({ action_type: AppConstants.FETCH_GAMES, path: 'owned' })
  })

  t.case('fetch installed', t => {
    return handler({ action_type: AppConstants.FETCH_GAMES, path: 'installed' }).then(() => {
      return handler({ action_type: AppConstants.INSTALL_PROGRESS })
    })
  })

  t.case('fetch dashboard', t => {
    let mock = t.mock(CredentialsStore.get_current_user())
    mock.expects('my_games').resolves(Immutable({games: [{}, {}, {}]}))
    return handler({ action_type: AppConstants.FETCH_GAMES, path: 'dashboard' })
  })

  t.case('fetch install', t => {
    t.stub(db, 'find_one').resolves({game_id: 64})
    return handler({ action_type: AppConstants.FETCH_GAMES, path: 'installs/46' })
  })

  t.case('fetch collections', t => {
    t.stub(db, 'find_one').resolves({game_ids: [1, 2, 3, 4, 5]})
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

    let update = t.stub(db, 'update')
    return handler({ action_type: AppConstants.FETCH_GAMES, path: 'collections/78' }).then(() => {
      sinon.assert.calledWith(update, {_table: 'collections', id: 78}, {$set: {game_ids: [1, 3, 5, 7, 9]}})
    })
  })
})
