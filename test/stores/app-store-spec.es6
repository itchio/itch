import test from 'zopf'
import mori from 'mori'
import proxyquire from 'proxyquire'

import AppConstants from '../../app/constants/app-constants'

import electron from '../stubs/electron'
import AppDispatcher from '../stubs/app-dispatcher'
import AppActions from '../stubs/app-actions'
import CredentialsStore from '../stubs/credentials-store'
import defer from '../stubs/defer'
import db from '../stubs/db'

test('AppStore', t => {
  let GameStore = {
    add_change_listener: t.spy(),
    get_state: () => [7, 3, 1]
  }

  let os = {
    process_type: () => 'renderer',
    '@global': true
  }

  let Store = proxyquire('../../app/stores/store', Object.assign({
    '../util/os': os
  }, electron))

  let subscriptions = {}
  t.stub(Store, 'subscribe', (name, cb) => subscriptions[name] = cb)

  let stubs = Object.assign({
    './credentials-store': CredentialsStore,
    '../actions/app-actions': AppActions,
    '../dispatcher/app-dispatcher': AppDispatcher,
    '../util/db': db,
    '../util/defer': defer,
    '../util/os': os,
    './game-store': GameStore,
    './store': Store
  }, electron)

  let AppStore = proxyquire('../../app/stores/app-store', stubs)
  let handler = AppDispatcher.get_handler('app-store')

  t.stub(CredentialsStore.get_current_user(), 'my_collections').resolves({collections: []})

  let get_state = () => mori.toJs(AppStore.get_state())

  t.case('GameStore change', t => {
    subscriptions['game-store'](GameStore.get_state())
    t.same(get_state().library.games, GameStore.get_state())
  })

  t.case('setup_status', t => {
    let message = 'Hold on to your ifs'
    handler({ action_type: AppConstants.SETUP_STATUS, message })
    t.is(get_state().setup.message, message)
  })

  t.case('focus_panel', t => {
    let panel = 'settings'
    handler({ action_type: AppConstants.LIBRARY_FOCUS_PANEL, panel })
    t.is(get_state().library.panel, panel)
  })

  t.case('no_stored_credentials', t => {
    handler({ action_type: AppConstants.NO_STORED_CREDENTIALS })
    t.is(get_state().page, 'login')
  })

  t.case('login flow', t => {
    handler({ action_type: AppConstants.LOGIN_WITH_PASSWORD })
    t.ok(get_state().login.loading, 'loading after login_with_password')

    handler({ action_type: AppConstants.LOGIN_FAILURE, errors: ['ha!'] })
    t.notOk(get_state().login.loading, 'not loading after failure')

    handler({ action_type: AppConstants.LOGIN_WITH_PASSWORD })
    t.ok(get_state().login.loading, 'loading after login_with_password')

    handler({ action_type: AppConstants.AUTHENTICATED })
    t.notOk(get_state().login.loading, 'not loading after authenticated')
    t.is(get_state().page, 'library', 'library after authenticated')

    handler({ action_type: AppConstants.LOGOUT })
    t.is(get_state().page, 'login')
  })

  t.case('install_progress', t => {
    let opts = {id: 42, a: 'b'}
    handler({ action_type: AppConstants.INSTALL_PROGRESS, opts })
    t.same(get_state().library.installs, {'42': {id: 42, a: 'b'}})
  })
})
