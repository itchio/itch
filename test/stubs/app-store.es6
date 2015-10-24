import mori from 'mori'

let handlers = []

export default {
  get_state: () => mori.toClj({}),
  emit_change: () => {
    for (let h of handlers) { h() }
  },
  add_change_listener: (name, l) => {
    handlers.push(l)
  },
  remove_change_listener: () => {
    handlers.length = 0
  },
  '@noCallThru': true
}
