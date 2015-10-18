
import Promise from 'bluebird'

let handlers = []

let self = {
  register: (h) => {
    handlers.push(h)
    return handlers.length - 1
  },
  dispatch: () => Promise.resolve(),
  wait_for: () => Promise.resolve(),
  get_handler: (store) => handlers[store.dispatch_token],
  '@noCallThru': true,
  '@global': true
}

export default self
