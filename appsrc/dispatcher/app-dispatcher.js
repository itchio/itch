
const os = require('../util/os')

if (os.process_type() === 'renderer') {
  module.exports = require('./app-dispatcher/renderer')
} else {
  module.exports = require('./app-dispatcher/browser')
}
