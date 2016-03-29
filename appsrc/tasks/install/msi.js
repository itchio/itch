
import spawn from '../../util/spawn'
import os from '../../util/os'

import AppActions from '../../actions/app-actions'

import mklog from '../../util/log'
const log = mklog('installers/msi')

const self = {
  logPath: function (operation, msiPath) {
    return `${msiPath}.${operation}.log.txt`
  },

  args: function (operation, msiPath, targetPath) {
    const logPath = self.logPath(operation, msiPath)

    return [
      'ALLUSERS=2', 'MSIINSTALLPERUSER=1', // single-user install (no need for UAC dialog)
      // try to specify install location (do not expect it to work)
      `TARGETDIR=${targetPath}`,
      `INSTALLDIR=${targetPath}`,
      `APPDIR=${targetPath}`,
      '/norestart', // do not restart computer while running client
      '/quiet', // no UI at all
      '/l*v', logPath, // store verbose log on disk
      `/${operation}`, msiPath
    ]
  },

  install: async function (out, opts) {
    AppActions.cave_progress({id: opts.id, progress: -1})

    if (os.platform() !== 'win32') {
      throw new Error('MSI files are only supported on Windows')
    }

    const archivePath = opts.archivePath
    const destPath = opts.destPath
    const logger = opts.logger

    await spawn({
      command: 'msiexec',
      args: self.args('i', archivePath, destPath),
      onToken: (token) => log(opts, token),
      logger
    })
  },

  uninstall: async function (out, opts) {
    if (os.platform() !== 'win32') {
      throw new Error('MSI files are only supported on Windows')
    }

    AppActions.cave_progress({id: opts.id, progress: -1})

    const archivePath = opts.archivePath
    const destPath = opts.destPath
    const logger = opts.logger

    await spawn({
      command: 'msiexec',
      args: self.args('x', archivePath, destPath),
      logger
    })
  }
}

export default self
