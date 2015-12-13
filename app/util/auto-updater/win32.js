'use strict'

let os = require('../os')
let reg = require('../reg')

let self = {
  on_install: async () => {
    // Optionally do things such as:
    //
    // - Install desktop and start menu shortcuts
    // - Add your .exe to the PATH
    // - Write to the registry for things like file associations and
    //   explorer context menus
    // Always quit when done

    await reg.install()
    return true
  },

  on_uninstall: async () => {
    // Undo anything you did in the --squirrel-install and
    // --squirrel-updated handlers
    // Always quit when done

    await reg.uninstall()
    return true
  },

  on_obsolete: async () => {
    // This is called on the outgoing version of your app before
    // we update to the new version - it's the opposite of
    // --squirrel-updated

    return true
  },

  start: async () => {
    let squirrel_command = os.cli_args()[1]
    switch (squirrel_command) {
      case '--squirrel-install':
      case '--squirrel-updated':
        return await self.on_install()
      case '--squirrel-uninstall':
        return await self.on_uninstall()
      case '--squirrel-obsolete':
        return await self.on_obsolete()
    }
    return false
  }
}

module.exports = self
