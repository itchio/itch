import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'

import Store from './store'

import config from '../util/config'
import api from '../util/api'

let current_user = null
let me = null

let CredentialsStore = Object.assign(new Store('credentials-store'), {
  get_current_user: () => current_user,
  get_me: () => me
})

function got_key (key) {
  config.set('api_key', key)
  current_user = new api.User(api.client, key)
  CredentialsStore.emit_change()
  AppActions.authenticated(key)
}

function login_failure (res) {
  AppActions.login_failure(res.errors)
}

function login_with_password (action) {
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
  let key = config.get('api_key')
  if (key) {
    AppActions.setup_status('Logging in', 'heart-filled')
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
  on(AppConstants.SETUP_DONE, setup_done)

  on(AppConstants.LOGIN_WITH_PASSWORD, login_with_password)
  on(AppConstants.LOGOUT, logout)
}))

export default CredentialsStore
