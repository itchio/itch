
import spawn from '../../util/spawn'
import os from '../../util/os'

import mklog from '../../util/log'
const log = mklog('installers/msi')

const self = {
  logPath: function (msiPath) {
    return `${msiPath}.log.txt`
  },

  args: function (operation, msiPath, targetPath) {
    const logPath = self.logPath(msiPath)

    return [
      '--msiexec',
      operation,
      msiPath,
      targetPath,
      logPath
    ]
  },

  install: async function (out, opts) {
    out.emit('progress', -1)

    if (os.platform() !== 'win32') {
      throw new Error('MSI files are only supported on Windows')
    }

    const archivePath = opts.archivePath
    const destPath = opts.destPath
    const logger = opts.logger

    await spawn({
      command: 'elevate',
      args: self.args('--install', archivePath, destPath),
      onToken: (token) => log(opts, token),
      onErrToken: (token) => log(opts, token),
      logger
    })
  },

  uninstall: async function (out, opts) {
    if (os.platform() !== 'win32') {
      throw new Error('MSI files are only supported on Windows')
    }

    out.emit('progress', -1)

    const archivePath = opts.archivePath
    const destPath = opts.destPath
    const logger = opts.logger

    await spawn({
      command: 'elevate',
      args: self.args('--uninstall', archivePath, destPath),
      onToken: (token) => log(opts, token),
      onErrToken: (token) => log(opts, token),
      logger
    })
  }
}

export default self
