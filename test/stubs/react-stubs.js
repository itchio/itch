
let electron = require('./electron')

let defer = require('./defer')
let AppStore = require('./app-store')
let AppActions = require('./app-actions')
let Store = require('./store')

let i18next = {
  '@global': true,
  use: () => i18next,
  init: () => i18next,
  on: () => null,
  off: () => null,
  t: (x) => x
}

let self = Object.assign({
  '../util/defer': defer,
  '../stores/app-store': AppStore,
  '../actions/app-actions': AppActions,
  './store': Store,
  i18next
}, electron)

Object.assign(self, { defer, AppStore, AppActions })

module.exports = self
