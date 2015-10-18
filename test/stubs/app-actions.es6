
import Promise from 'bluebird'

let noop = () => Promise.resolve()

let self = {
  hide_window: noop,
  quit: noop,
  install_update: noop,
  logout: noop,
  no_stored_credentials: noop,
  setup_status: noop,
  authenticated: () => {
    console.log('In authenticated!')
    return Promise.resolve()
  },
  '@noCallThru': true
}

export default self
