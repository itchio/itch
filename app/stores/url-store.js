'use strict'

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let Store = require('./store')

let Logger = require('../util/log').Logger
let opts = {
  logger: new Logger()
}
let log = require('../util/log')('url-store')

let UrlStore = Object.assign(new Store('url-store'), {})

function open_url (payload) {
  let url = payload.url
  log(opts, `open_url: stub — ${url}`)
}

AppDispatcher.register('url-store', Store.action_listeners(on => {
  on(AppConstants.OPEN_URL, open_url)
}))

module.exports = UrlStore
