
let electron = require('./electron')

let defer = require('./defer')
let AppStore = require('./app-store')
let AppActions = require('./app-actions')

let self = Object.assign({
  '../util/defer': defer,
  '../stores/app-store': AppStore,
  '../actions/app-actions': AppActions
}, electron)

Object.assign(self, { defer, AppStore, AppActions })

module.exports = self
