
import test from 'zopf'
const handlers = []

const self = {
  get_state: () => {},
  emit_change: (state) => {
    for (let h of handlers) { h(state) }
  },
  add_change_listener: (name, l) => {
    handlers.push(l)
  },
  remove_change_listener: () => {
    handlers.length = 0
  }
}

module.exports = test.module(self)
