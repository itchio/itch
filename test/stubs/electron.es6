
let rnil = () => null

let stubs = {
  app: {
    getVersion: () => '1.0',
    getPath: () => 'tmp/',
    quit: rnil,
    dock: {
      setMenu: rnil
    }
  },
  tray: function () {
    Object.assign(this, stubs.tray)
  },
  ipc: {
    on: rnil,
    send: rnil
  },
  remote: {
    require: () => {}
  },
  shell: {
    openItem: rnil,
    openExternal: rnil
  },
  dialog: {
    showMessagseBox: rnil
  },
  menu: {
    buildFromTemplate: rnil,
    setApplicationMenu: rnil
  }
}

Object.assign(stubs.tray, {
  setToolTip: rnil,
  setContextMenu: rnil,
  on: rnil
})

Object.keys(stubs).forEach((key) => {
  Object.assign(stubs[key], {
    '@noCallThru': true,
    '@global': true
  })
})

export default stubs
