'use nodent';'use strict'
let test = require('zopf')
let proxyquire = require('proxyquire')

let AppConstants = require('../../app/constants/app-constants')

let electron = require('../stubs/electron')
let AppDispatcher = require('../stubs/app-dispatcher')
let AppActions = require('../stubs/app-actions')
let config = require('../stubs/config')
let api = require('../stubs/api')
let defer = require('../stubs/defer')

let SetupStore = {
  is_ready: () => true
}

test('CredentialsStore', t => {
  let stubs = Object.assign({
    '../util/defer': defer,
    '../util/config': config,
    '../util/api': api,
    '../actions/app-actions': AppActions,
    '../dispatcher/app-dispatcher': AppDispatcher,
    './setup-store': SetupStore
  }, electron)

  let CredentialsStore = proxyquire('../../app/stores/credentials-store', stubs)
  let handler = AppDispatcher.get_handler('credentials-store')

  t.case('window_ready (no credentials)', t => {
    t.mock(AppActions).expects('no_stored_credentials').resolves()
    return handler({ action_type: AppConstants.WINDOW_READY })
  })

  t.case('login with key + logout', t => {
    let user = {name: 'Pete'}
    t.mock(AppActions).expects('authenticated')
    t.stub(config, 'get').returns('numazu')
    t.stub(api.client, 'login_key').resolves({user})

    handler({ action_type: AppConstants.WINDOW_READY })

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        t.ok(CredentialsStore.get_current_user(), 'has current user after setup')
        t.same(CredentialsStore.get_me(), user, 'has me after setup')

        handler({ action_type: AppConstants.LOGOUT })
        t.notOk(CredentialsStore.get_current_user(), 'no current user after logout')
        t.notOk(CredentialsStore.get_me(), 'no me after setup')
        resolve()
      }, 20)
    })
  })

  t.case('login with password', t => {
    let user = {name: 'Pete'}
    let username = 'foo'
    let password = 'bar'
    let key = 'numazu'

    t.mock(AppActions).expects('authenticated').resolves()
    t.stub(api.client, 'login_with_password').resolves({key: {key}})
    t.stub(api.user, 'me').resolves({user})

    handler({ action_type: AppConstants.LOGIN_WITH_PASSWORD, username, password })

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        t.ok(CredentialsStore.get_current_user())
        t.same(CredentialsStore.get_me(), user)
        resolve()
      }, 20)
    })
  })
})
