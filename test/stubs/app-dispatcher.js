'use nodent';'use strict'

let handlers = {}

let self = {
  register: (name, cb) => {
    handlers[name] = cb
  },
  dispatch: () => null,
  get_handler: (name) => {
    return handlers[name]
  },
  '@noCallThru': true,
  '@global': true
}

module.exports = self
