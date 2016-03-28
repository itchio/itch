
import invariant from 'invariant'
import pathmaker from '../util/pathmaker'

import sf from '../util/sf'
import mklog from '../util/log'
const log = mklog('tasks/uninstall')

import core from './install/core'

const keepArchives = (process.env.REMEMBER_ME_WHEN_IM_GONE === '1')

export default async function start (out, opts) {
  const {cave, globalMarket} = opts
  invariant(cave, 'uninstall has cave')
  invariant(globalMarket, 'uninstall has cave')

  const onProgress = (info) => out.emit('progress', info.percent)

  const destPath = pathmaker.appPath(cave)

  if (cave.uploadId && cave.uploads && cave.uploads[cave.uploadId]) {
    const upload = cave.uploads[cave.uploadId]

    const archivePath = pathmaker.archivePath(upload)

    log(opts, `Uninstalling app in ${destPath} from archive ${archivePath}`)

    const coreOpts = {
      ...opts,
      onProgress,
      archivePath
    }
    globalMarket.saveEntity('caves', cave.id, {launchable: false})

    try {
      await core.uninstall(out, coreOpts)
      log(opts, `Uninstallation successful`)
    } catch (e) {
      if (e instanceof core.UnhandledFormat) {
        log(opts, e.message)
        log(opts, `Imploding anyway`)
        await sf.wipe(destPath)
      } else {
        // re-raise other errors
        throw e
      }
    }

    if (!keepArchives) {
      log(opts, `Erasing archive ${archivePath}`)
      await sf.wipe(archivePath)
    }
  }

  log(opts, `Imploding ${destPath}`)
  globalMarket.deleteEntity('caves', cave.id)
}
