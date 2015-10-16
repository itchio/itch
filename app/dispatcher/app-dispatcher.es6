
import os from '../util/os'

// This makes sure everything is dispatched to the node side, whatever happens
if (os.process_type() === 'renderer') {
  let remote = require('remote')
  module.exports = remote.require('./dispatcher/app-dispatcher')
} else {
  let Dispatcher = require('flux').Dispatcher
  module.exports = new Dispatcher()
}
