
import sf from '../../util/sf'

import path from 'path'

import mklog from '../../util/log'
const log = mklog('installers/naked')

const self = {
  install: async function (opts) {
    const archivePath = opts.archivePath
    const destPath = opts.destPath

    await sf.mkdir(destPath)

    const dest_filePath = path.join(destPath, path.basename(archivePath))
    log(opts, `copying ${archivePath} to ${dest_filePath}`)

    await sf.ditto(archivePath, dest_filePath)
  },

  uninstall: async function (opts) {
    const destPath = opts.destPath

    log(opts, `nuking ${destPath}`)
    await sf.wipe(destPath)
  }
}

export default self
