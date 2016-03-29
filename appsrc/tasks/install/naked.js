
import sf from '../../util/sf'
import invariant from 'invariant'

import path from 'path'

import mklog from '../../util/log'
const log = mklog('installers/naked')

const self = {
  install: async function (out, opts) {
    const {archivePath, destPath} = opts
    invariant(archivePath, 'naked has archivePath')
    invariant(destPath, 'naked has destPath')

    await sf.mkdir(destPath)

    const destFilePath = path.join(destPath, path.basename(archivePath))
    log(opts, `copying ${archivePath} to ${destFilePath}`)

    await sf.ditto(archivePath, destFilePath)
  },

  uninstall: async function (out, opts) {
    const {destPath} = opts

    log(opts, `nuking ${destPath}`)
    await sf.wipe(destPath)
  }
}

export default self
