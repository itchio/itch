
import test from 'zopf'
const handlers = {}

const self = {
  register: (name, cb) => {
    handlers[name] = cb
  },
  dispatch: () => null,
  get_handler: (name) => {
    return handlers[name]
  }
}

module.exports = test.module(self)
