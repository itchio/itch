
let electron = require('./electron')
let react_i18next = require('./react-i18next')

let defer = require('./defer')
let AppStore = require('./app-store')
let AppActions = require('./app-actions')

let self = Object.assign({
  'react-i18next': react_i18next,
  '../util/defer': defer,
  '../stores/app-store': AppStore,
  '../actions/app-actions': AppActions
}, electron)

Object.assign(self, { defer, AppStore, AppActions })

module.exports = self
