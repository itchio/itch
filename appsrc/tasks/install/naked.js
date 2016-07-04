
import sf from '../../util/sf'
import butler from '../../util/butler'
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

    await butler.ditto(archivePath, destFilePath, opts)
  },

  uninstall: async function (out, opts) {
    const {destPath} = opts

    log(opts, `nuking ${destPath}`)
    await butler.wipe(destPath, opts)
  }
}

export default self
