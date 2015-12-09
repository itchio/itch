'use nodent';'use strict'
let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let AppActions = require('../actions/app-actions')

let Store = require('./store')
let SetupStore = require('./setup-store')

let config = require('../util/config')
let api = require('../util/api')

let current_user = null
let me = null
let delayed_key = null

let CredentialsStore = Object.assign(new Store('credentials-store'), {
  get_current_user: () => current_user,
  get_me: () => me
})

function got_key (key) {
  delayed_key = null

  if (!SetupStore.is_ready()) {
    delayed_key = key
    AppActions.setup_wait()
    return
  }

  config.set('api_key', key)
  current_user = new api.User(api.client, key)
  CredentialsStore.emit_change()
  AppActions.authenticated(key)
}

function login_failure (res) {
  AppActions.login_failure(res.errors)
}

function login_with_password (action) {
  AppActions.login_attempt()

  let {username, password} = action
  return api.client.login_with_password(username, password).then((res) => {
    let key = res.key.key
    let user = new api.User(api.client, key)
    return user.me().then(res => {
      me = res.user
      got_key(key)
    })
  }).catch(login_failure)
}

function setup_done () {
  if (delayed_key) {
    got_key(delayed_key)
  }
}

function window_ready () {
  let key = config.get('api_key')
  if (key) {
    AppActions.login_attempt()

    return api.client.login_key(key).then((res) => {
      me = res.user
      CredentialsStore.emit_change()
      got_key(key)
    }).catch(login_failure)
  } else {
    AppActions.no_stored_credentials()
  }
}

function logout () {
  config.clear('api_key')
  current_user = null
  me = null
  CredentialsStore.emit_change()
}

AppDispatcher.register('credentials-store', Store.action_listeners(on => {
  on(AppConstants.WINDOW_READY, window_ready)
  on(AppConstants.SETUP_DONE, setup_done)

  on(AppConstants.LOGIN_WITH_PASSWORD, login_with_password)
  on(AppConstants.LOGOUT, logout)
}))

module.exports = CredentialsStore
