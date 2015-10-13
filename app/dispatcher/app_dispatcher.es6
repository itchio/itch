
// This makes sure everything is dispatched to the node side, whatever happens
if (process.type == 'renderer') {
  let remote = window.require('remote')
  module.exports = remote.require('./dispatcher/app_dispatcher')
  console.log(`Required dispatcher in renderer`);
} else {
  let Dispatcher = require('flux').Dispatcher
  module.exports = new Dispatcher()
  console.log(`Required dispatcher in node`);
}
