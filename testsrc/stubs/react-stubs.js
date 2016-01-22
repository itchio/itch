
let electron = require('./electron')

let defer = require('./defer')
let AppStore = require('./app-store')
let AppActions = require('./app-actions')
let AppDispatcher = require('./app-dispatcher')
let Store = require('./store')

let i18next = {
  '@global': true,
  '@noCallThru': true,
  use: () => i18next,
  init: () => i18next,
  on: () => null,
  off: () => null,
  t: (x) => x,
  addResources: () => null,
  getFixedT: () => i18next.t
}

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
