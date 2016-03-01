
import electron from './electron'

import defer from './defer'
import AppStore from './app-store'
import AppActions from './app-actions'
import AppDispatcher from './app-dispatcher'
import Store from './store'

import i18next from './i18next'

let self = Object.assign({
  '../util/defer': defer,
  '../stores/app-store': AppStore,
  '../actions/app-actions': AppActions,
  '../dispatcher/app-dispatcher': AppDispatcher,
  './store': Store,
  i18next
}, electron)

Object.assign(self, { defer, AppStore, AppDispatcher, AppActions })

export default self
