
const electron = require('./electron')

const defer = require('./defer')
const AppStore = require('./app-store')
const AppActions = require('./app-actions')
const AppDispatcher = require('./app-dispatcher')
const Store = require('./store')

const i18next = require('./i18next')

let self = Object.assign({
  '../util/defer': defer,
  '../stores/app-store': AppStore,
  '../actions/app-actions': AppActions,
  '../dispatcher/app-dispatcher': AppDispatcher,
  './store': Store,
  i18next
}, electron)

Object.assign(self, { defer, AppStore, AppDispatcher, AppActions })

module.exports = self
