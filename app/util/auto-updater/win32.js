'use nodent';'use strict'
'use nodent-promises';'use strict'

import app from 'app'
import os from '../os'

let self = {
  on_install: () => {
    // Optionally do things such as:
    //
    // - Install desktop and start menu shortcuts
    // - Add your .exe to the PATH
    // - Write to the registry for things like file associations and
    //   explorer context menus
    // Always quit when done
    app.quit()
    return true
  },

  on_uninstall: () => {
    // Undo anything you did in the --squirrel-install and
    // --squirrel-updated handlers
    // Always quit when done
    app.quit()
    return true
  },

  on_obsolete: () => {
    // This is called on the outgoing version of your app before
    // we update to the new version - it's the opposite of
    // --squirrel-updated
    app.quit()
    return true
  },

  start: () => {
    let squirrel_command = os.cli_args()[1]
    switch (squirrel_command) {
      case '--squirrel-install':
      case '--squirrel-updated':
        return self.on_install()
      case '--squirrel-uninstall':
        return self.on_uninstall()
      case '--squirrel-obsolete':
        return self.on_obsolete()
    }
    return false
  }
}

export default self
