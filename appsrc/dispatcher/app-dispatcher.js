
import os from '../util/os'

let specific_dispatcher

if (os.process_type() === 'renderer') {
  specific_dispatcher = require('./app-dispatcher/renderer')
} else {
  specific_dispatcher = require('./app-dispatcher/browser')
}

export default specific_dispatcher
