
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
    let onprogress = opts.onprogress || onprogress
    let emitter = opts.emitter

    let cave = CaveStore.find(id)
    let dest_path = CaveStore.app_path(cave.install_location, id)

    if (cave.upload_id && cave.uploads && cave.uploads[cave.upload_id]) {
      let upload = cave.uploads[cave.upload_id]

      let archive_path = CaveStore.archive_path(cave.install_location, upload)

      log(opts, `Uninstalling app in ${dest_path} from archive ${archive_path}`)

      let core_opts = { id, logger, onerror, onprogress, archive_path, dest_path, cave, emitter }

      AppActions.update_cave(id, {launchable: false})

      try {
        await core.uninstall(core_opts)
        log(opts, `Uninstallation successful`)
      } catch (e) {
        if (e instanceof core.UnhandledFormat) {
          log(opts, e.message)
          log(opts, `Imploding anyway`)
          await sf.wipe(dest_path)
        } else {
          // re-raise other errors
          throw e
        }
      }

      if (!keep_archives) {
        log(opts, `Erasing archive ${archive_path}`)
        await sf.wipe(archive_path)
      }
    }

    log(opts, `Imploding ${dest_path}`)
    AppActions.implode_cave(id)
  }
}

export default self
