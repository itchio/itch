import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'

import AppStore from './app-store'
import Store from './store'

import config from '../util/config'
import api from '../util/api'

let current_user = null
let me = null

let CredentialsStore = Object.assign(new Store(), {
  get_current_user: function () {
    return current_user
  },

  get_me: function () {
    return me
  }
})

function login_with_password (action) {
  let {username, password} = action
  api.client.login_with_password(username, password).then((res) => {
    me = res.user
    CredentialsStore.emit_change()
    setImmediate(_ => AppActions.authenticated(res.key.key))
  }).catch(AppActions.login_failure)
}

function boot () {
  // TODO: move setup to its own store
  AppDispatcher.wait_for(AppStore).then(_ => {
    let key = config.get('api_key')
    api.client.login_key(key).then((res) => {
      me = res.user
      CredentialsStore.emit_change()
      setImmediate(_ => AppActions.authenticated(key))
    }).catch(AppActions.login_failure)
  })
}

function authenticated (action) {
  let {key} = action
  config.set('api_key', key)
  current_user = new api.User(api.client, key)
  CredentialsStore.emit_change()
}

function logout () {
  config.clear('api_key')
  current_user = null
  CredentialsStore.emit_change()
}

CredentialsStore.dispatch_token = AppDispatcher.register(Store.action_listeners(on => {
  on(AppConstants.BOOT, boot)

  on(AppConstants.LOGIN_WITH_PASSWORD, login_with_password)
  on(AppConstants.AUTHENTICATED, authenticated)
  on(AppConstants.LOGOUT, logout)
}))

export default CredentialsStore
