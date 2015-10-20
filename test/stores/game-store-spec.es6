import test from 'zopf'
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
    handler({ action_type: AppConstants.FETCH_GAMES, path: 'owned' })
  })

  t.case('fetch installed', t => {
    handler({ action_type: AppConstants.FETCH_GAMES, path: 'installed' })
    handler({ action_type: AppConstants.INSTALL_PROGRESS })
  })

  t.case('fetch dashboard', t => {
    let mock = t.mock(CredentialsStore.get_current_user())
    mock.expects('my_games').resolves(Immutable({games: [{}, {}, {}]}))
    handler({ action_type: AppConstants.FETCH_GAMES, path: 'dashboard' })
  })

  t.case('fetch install', t => {
    t.stub(db, 'find_one').resolves({game_id: 64})
    handler({ action_type: AppConstants.FETCH_GAMES, path: 'installs/46' })
  })

  t.case('fetch collections', t => {
    t.stub(db, 'find_one').resolves({game_ids: [7, 4, 1]})
    handler({ action_type: AppConstants.FETCH_GAMES, path: 'collections/78' })
  })
})
