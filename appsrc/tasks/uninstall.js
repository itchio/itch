
import noop from '../util/noop'
import sf from '../util/sf'
import mklog from '../util/log'
const log = mklog('tasks/uninstall')

import CaveStore from '../stores/cave-store'
import AppActions from '../actions/app-actions'

import core from './install/core'

const keep_archives = (process.env.REMEMBER_ME_WHEN_IM_GONE === '1')

let self = {
  start: async function (opts) {
    let id = opts.id
    let logger = opts.logger
    let onerror = opts.onerror || noop
    let onProgress = opts.onProgress || onProgress
    let emitter = opts.emitter

    let cave = CaveStore.find(id)
    let destPath = CaveStore.appPath(cave.install_location, id)

    if (cave.upload_id && cave.uploads && cave.uploads[cave.upload_id]) {
      let upload = cave.uploads[cave.upload_id]

      let archivePath = CaveStore.archivePath(cave.install_location, upload)

      log(opts, `Uninstalling app in ${destPath} from archive ${archivePath}`)

      let coreOpts = {id, logger, onerror, onProgress, archivePath, destPath, cave, emitter}

      AppActions.update_cave(id, {launchable: false})

      try {
        await core.uninstall(coreOpts)
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

      if (!keep_archives) {
        log(opts, `Erasing archive ${archivePath}`)
        await sf.wipe(archivePath)
      }
    }

    log(opts, `Imploding ${destPath}`)
    AppActions.implode_cave(id)
  }
}

export default self
