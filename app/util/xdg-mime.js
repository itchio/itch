'use strict'

let spawn = require('./spawn')
let log = require('./log')('xdg-mime')

let self = {

  mime_type: 'x-scheme-handler/itchio',

  async query (opts) {
    return await spawn({
      command: 'xdg-mime',
      args: ['query', 'default', self.mime_type],
      ontoken: (tok) => log(opts, `query: tok`)
    })
  },

  async set_default (opts) {
    return await spawn({
      command: 'xdg-mime',
      args: ['default', 'itch.desktop', self.mime_type],
      ontoken: (tok) => log(opts, `set_default: tok`)
    })
  },

  // lets us handle the itchio:// URL scheme on linux / freedesktop
  async register_if_needed (opts) {
    try {
      await self.set_default()
      await self.query()
    } catch (e) {
      log(opts, `Couldn't register xdg mime-type handler: ${e.stack || e}`)
    }
  }

}

module.exports = self
