
let stubs = {}

;['app', 'browser-window', 'menu', 'tray', 'shell', 'dialog', 'remote', 'ipc'].forEach((stub) => {
  stubs[stub] = {
    '@noCallThru': true,
    '@global': true
  }
})

stubs.app.getVersion = () => '1.0'
stubs.app.getPath = () => 'tmp/'
stubs.app.quit = () => null

stubs.ipc.on = () => null
stubs.ipc.send = () => null

stubs.remote.require = () => {}

stubs.shell.openItem = () => null

export default stubs
