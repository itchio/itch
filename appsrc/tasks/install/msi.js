
import spawn from '../../util/spawn'
import os from '../../util/os'

import AppActions from '../../actions/app-actions'

import mklog from '../../util/log'
const log = mklog('installers/msi')

const self = {
  log_path: function (operation, msi_path) {
    return `${msi_path}.${operation}.log.txt`
  },

  args: function (operation, msi_path, target_path) {
    const log_path = self.log_path(operation, msi_path)

    return [
      'ALLUSERS=2', 'MSIINSTALLPERUSER=1', // single-user install (no need for UAC dialog)
      // try to specify install location (do not expect it to work)
      `TARGETDIR=${target_path}`,
      `INSTALLDIR=${target_path}`,
      `APPDIR=${target_path}`,
      '/norestart', // do not restart computer while running client
      '/quiet', // no UI at all
      '/l*v', log_path, // store verbose log on disk
      `/${operation}`, msi_path
    ]
  },

  install: async function (opts) {
    AppActions.cave_progress({id: opts.id, progress: -1})

    if (os.platform() !== 'win32') {
      throw new Error('MSI files are only supported on Windows')
    }

    const archive_path = opts.archive_path
    const dest_path = opts.dest_path
    const logger = opts.logger

    await spawn({
      command: 'msiexec',
      args: self.args('i', archive_path, dest_path),
      ontoken: (token) => log(opts, token),
      logger
    })
  },

  uninstall: async function (opts) {
    if (os.platform() !== 'win32') {
      throw new Error('MSI files are only supported on Windows')
    }

    AppActions.cave_progress({id: opts.id, progress: -1})

    const archive_path = opts.archive_path
    const dest_path = opts.dest_path
    const logger = opts.logger

    await spawn({
      command: 'msiexec',
      args: self.args('x', archive_path, dest_path),
      logger
    })
  }
}

export default self
