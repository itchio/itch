
const AppDispatcher = require('../dispatcher/app-dispatcher')
const AppConstants = require('../constants/app-constants')
const AppActions = require('../actions/app-actions')

const Store = require('./store')
const SetupStore = require('./setup-store')

const config = require('../util/config')
const api = require('../util/api')

let current_user = null
let me = null
let delayed_key = null

let CredentialsStore = Object.assign(new Store('credentials-store'), {
  get_current_user: () => current_user,
  get_me: () => me,
  get_state: () => ({me, current_user})
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

function login_failure (err) {
  AppActions.login_failure(err.errors || err.stack || err)
}

async function login_with_password (payload) {
  AppActions.attempt_login()

  try {
    let username = payload.username
    let password = payload.password
    let key = (await api.client.login_with_password(username, password)).key.key

    let user = new api.User(api.client, key)
    me = (await user.me()).user

    got_key(key)
  } catch (err) {
    login_failure(err)
  }
}

function setup_done () {
  if (delayed_key) {
    got_key(delayed_key)
  }
}

async function window_ready () {
  let key = config.get('api_key')
  if (key) {
    AppActions.attempt_login()

    try {
      me = (await api.client.login_key(key)).user
      CredentialsStore.emit_change()
      got_key(key)
    } catch (err) {
      login_failure(err)
    }
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
