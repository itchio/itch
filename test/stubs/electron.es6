
let stubs = {}

;['app', 'browser-window', 'menu', 'tray', 'shell', 'dialog', 'remote'].forEach((stub) => {
  stubs[stub] = {
    '@noCallThru': true,
    '@global': true
  }
})

stubs.app.getVersion = () => '1.0'
stubs.app.getPath = () => 'tmp/'
stubs.app.quit = () => null

stubs.remote.require = () => {}

export default stubs
