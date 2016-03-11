
import os from '../os'
import reg from '../reg'
import shortcut from '../shortcut'

const self = {
  onInstall: async () => {
    await reg.install()
    await shortcut.install()
    return true
  },

  onUpdate: async () => {
    await reg.update()
    await shortcut.update()
    return true
  },

  onUninstall: async () => {
    await reg.uninstall()
    await shortcut.uninstall()
    return true
  },

  onObsolete: async () => {
    // This is called on the outgoing version of your app before
    // we update to the new version - it's the opposite of --squirrel-update
    return true
  },

  start: async () => {
    const squirrelCommand = os.cliArgs()[1]
    switch (squirrelCommand) {
      case '--squirrel-install':
        return await self.onInstall()
      case '--squirrel-updated':
        return await self.onUpdate()
      case '--squirrel-uninstall':
        return await self.onUninstall()
      case '--squirrel-obsolete':
        return await self.onObsolete()
    }
    return false
  }
}

export default self
