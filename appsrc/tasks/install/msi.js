
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

    const msiCmd = opts.elevated ? '--elevated-install' : '--install'

    const code = await spawn({
      command: 'elevate.exe',
      args: self.args(msiCmd, archivePath, destPath),
      onToken: (token) => log(opts, token),
      onErrToken: (token) => log(opts, token),
      logger
    })

    if (code !== 0) {
      if (code === 1603 && !opts.elevated) {
        log(opts, 'msi installer exited with 1603, retrying elevated')
        return await self.install(out, {
          ...opts,
          elevated: true
        })
      }
      throw new Error(`msi installer exited with code ${code}`)
    }

    log(opts, 'msi installer completed successfully')
  },

  uninstall: async function (out, opts) {
    if (os.platform() !== 'win32') {
      throw new Error('MSI files are only supported on Windows')
    }

    out.emit('progress', -1)

    const archivePath = opts.archivePath
    const destPath = opts.destPath
    const logger = opts.logger

    const msiCmd = opts.elevated ? '--elevated-uninstall' : '--uninstall'
    const code = await spawn({
      command: 'elevate',
      args: self.args(msiCmd, archivePath, destPath),
      onToken: (token) => log(opts, token),
      onErrToken: (token) => log(opts, token),
      logger
    })

    if (code !== 0) {
      if (code === 1603 && !opts.elevated) {
        log(opts, 'msi uninstaller exited with 1603, retrying elevated')
        return await self.uninstall(out, {
          ...opts,
          elevated: true
        })
      }
      throw new Error(`msi uninstaller exited with code ${code}`)
    }

    log(opts, 'msi uninstaller completed successfully')
  }
}

export default self
