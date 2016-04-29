
import electron from './electron'

import defer from './defer'
import ChromeStore from './chrome-store'
import AppActions from './app-actions'
import AppDispatcher from './app-dispatcher'
import Store from './store'

const stubs = Object.assign({
  '../util/defer': defer,
  '../stores/chrome-store': ChromeStore,
  '../actions/app-actions': AppActions,
  '../dispatcher/app-dispatcher': AppDispatcher,
  './store': Store
}, electron)

Object.assign(stubs, {defer, ChromeStore, AppDispatcher, AppActions})

module.exports = stubs
