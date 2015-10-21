
let rnil = () => null

let stubs = {
  app: {
    getVersion: () => '1.0',
    getPath: () => 'tmp/',
    quit: rnil,
    dock: {
      setMenu: rnil,
      bounce: rnil,
      setBadge: rnil
    }
  },
  tray: function () {
    Object.assign(this, stubs.tray)
  },
  'browser-window': function () {
    Object.assign(this, stubs['browser-window'])
  },
  ipc: Object.assign({
    send: function () {
      this.emit.apply(this, arguments)
    }
  }, require('events').EventEmitter.prototype),
  remote: {
    require: () => {}
  },
  shell: {
    openItem: rnil,
    openExternal: rnil
  },
  dialog: {
    showMessageBox: rnil
  },
  menu: {
    buildFromTemplate: rnil,
    setApplicationMenu: rnil
  }
}

Object.assign(stubs.tray, {
  setToolTip: rnil,
  setContextMenu: rnil,
  on: rnil,
  displayBalloon: rnil // win32-only
})

let webContents = {
  on: (e, cb) => cb(),
  executeJavaScript: rnil
}

Object.assign(stubs['browser-window'], {
  setProgressBar: rnil,
  on: rnil,
  openDevTools: rnil,
  loadUrl: rnil,
  hide: rnil,
  show: rnil,
  webContents
})

Object.keys(stubs).forEach((key) => {
  Object.assign(stubs[key], {
    '@noCallThru': true,
    '@global': true
  })
})

export default stubs
