
let os = require('../os')
let reg = require('../reg')
let shortcut = require('../shortcut')

let self = {
  on_install: async () => {
    await reg.install()
    await shortcut.install()
    return true
  },

  on_update: async () => {
    await reg.update()
    await shortcut.update()
    return true
  },

  on_uninstall: async () => {
    await reg.uninstall()
    await shortcut.uninstall()
    return true
  },

  on_obsolete: async () => {
    // This is called on the outgoing version of your app before
    // we update to the new version - it's the opposite of --squirrel-update
    return true
  },

  start: async () => {
    let squirrel_command = os.cli_args()[1]
    switch (squirrel_command) {
      case '--squirrel-install':
        return await self.on_install()
      case '--squirrel-updated':
        return await self.on_update()
      case '--squirrel-uninstall':
        return await self.on_uninstall()
      case '--squirrel-obsolete':
        return await self.on_obsolete()
    }
    return false
  }
}

module.exports = self
