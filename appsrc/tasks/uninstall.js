
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

  const onProgress = (info) => out.emit('progress', info.percent / 100)

  const destPath = pathmaker.appPath(cave)

  let upload = null
  let archivePath = null

  if (cave.uploadId && cave.uploads && cave.uploads[cave.uploadId]) {
    upload = cave.uploads[cave.uploadId]
    archivePath = pathmaker.downloadPath(upload)
    log(opts, `Uninstalling app in ${destPath} from archive ${archivePath}`)
  } else {
    log(opts, `Uninstalling app in ${destPath}, no archive available`)
  }

  const coreOpts = {
    ...opts,
    onProgress,
    upload,
    archivePath,
    destPath
  }
  globalMarket.saveEntity('caves', cave.id, {launchable: false, dead: true})

  try {
    await core.uninstall(out, coreOpts)
    log(opts, 'Uninstallation successful')
  } catch (e) {
    if (e instanceof core.UnhandledFormat) {
      log(opts, e.message)
      log(opts, 'Imploding anyway')
      await sf.wipe(destPath)
    } else {
      // re-raise other errors
      throw e
    }
  }

  if (archivePath && !keepArchives) {
    log(opts, `Erasing archive ${archivePath}`)
    await sf.wipe(archivePath)
  }

  log(opts, `Imploding ${destPath}`)
  await globalMarket.deleteEntity('caves', cave.id, {wait: true})
}
