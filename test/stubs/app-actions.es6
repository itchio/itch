
import Promise from 'bluebird'

let noop = () => Promise.resolve()

let self = {
  boot: noop,
  quit: noop,

  hide_window: noop,

  install_update: noop,

  no_stored_credentials: noop,
  login_with_password: noop,
  authenticated: noop,
  logout: noop,

  setup_status: noop,

  eval: noop,
  '@noCallThru': true
}

export default self
