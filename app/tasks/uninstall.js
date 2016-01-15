
let noop = require('../util/noop')
let sf = require('../util/sf')
let log = require('../util/log')('tasks/uninstall')

let CaveStore = require('../stores/cave-store')
let AppActions = require('../actions/app-actions')

let core = require('./install/core')

let self = {
  start: async function (opts) {
    let id = opts.id
    let logger = opts.logger
    let onerror = opts.onerror || noop
    let onprogress = opts.onprogress || onprogress
    let emitter = opts.emitter

    let cave = await CaveStore.find(id)
    let dest_path = CaveStore.app_path(cave.install_location, id)

    if (cave.upload_id && cave.uploads && cave.uploads[cave.upload_id]) {
      let upload = cave.uploads[cave.upload_id]

      let archive_path = CaveStore.archive_path(cave.install_location, upload)

      log(opts, `Uninstalling app in ${dest_path} from archive ${archive_path}`)

      let core_opts = { id, logger, onerror, onprogress, archive_path, dest_path, cave, emitter }

      AppActions.cave_update(id, {launchable: false})

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
      AppActions.cave_update(id, {installed_archive_mtime: null})

      if (process.env.REMEMBER_ME_WHEN_IM_GONE !== '1') {
        log(opts, `Erasing archive ${archive_path}`)
        await sf.wipe(archive_path)
      }
    }

    log(opts, `Imploding ${dest_path}`)
    AppActions.cave_implode(id)
  }
}

module.exports = self
