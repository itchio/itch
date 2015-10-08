
import app from 'app'
import os from './util/os'

export function handle_startup_event () {
  if (os.platform() !== 'win32') {
    return false
  }

  let squirrel_command = os.cli_args()[1]
  switch (squirrel_command) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      //
      // - Install desktop and start menu shortcuts
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus
      // Always quit when done
      app.quit()
      return true
    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers
      // Always quit when done
      app.quit()
      return true
    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated
      app.quit()
      return true
  }
  return false
}
