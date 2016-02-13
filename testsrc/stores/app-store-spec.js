
let test = require('zopf')
let mori = require('mori')
let proxyquire = require('proxyquire')

let AppConstants = require('../../app/constants/app-constants')

let electron = require('../stubs/electron')

let AppDispatcher = require('../stubs/app-dispatcher')
let AppActions = require('../stubs/app-actions')
let CredentialsStore = require('../stubs/credentials-store')
let defer = require('../stubs/defer')
let db = require('../stubs/db')

test('AppStore', t => {
  let GameStore = {
    add_change_listener: t.spy(),
    get_state: () => {}
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
  })

  t.case('setup_status', t => {
    let message = 'Hold on to your ifs'
    handler({ action_type: AppConstants.SETUP_STATUS, message })
    t.is(get_state().login.setup.message, message)
  })

  t.case('focus_panel', t => {
    let panel = 'library'
    handler({ action_type: AppConstants.LIBRARY_FOCUS_PANEL, panel })
    t.is(get_state().library.panel, '')
    handler({ action_type: AppConstants.READY_TO_ROLL })
    handler({ action_type: AppConstants.LIBRARY_FOCUS_PANEL, panel })
    t.is(get_state().library.panel, panel)
  })

  t.case('no_stored_credentials', t => {
    handler({ action_type: AppConstants.NO_STORED_CREDENTIALS })
    t.is(get_state().page, 'login')
  })

  t.case('login flow', t => {
    handler({ action_type: AppConstants.ATTEMPT_LOGIN })
    t.ok(get_state().login.loading, 'loading after login_attempt')

    handler({ action_type: AppConstants.LOGIN_FAILURE, errors: ['ha!'] })
    t.notOk(get_state().login.loading, 'not loading after failure')

    handler({ action_type: AppConstants.ATTEMPT_LOGIN })
    t.ok(get_state().login.loading, 'loading after login_attempt')

    handler({ action_type: AppConstants.READY_TO_ROLL })
    t.notOk(get_state().login.loading, 'not loading after ready-to-roll')
    t.is(get_state().page, 'library', 'library after ready-to-roll')

    handler({ action_type: AppConstants.LOGOUT })
    t.is(get_state().page, 'login')
  })
})
