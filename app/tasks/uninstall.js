

let noop = require('../util/noop')
let rimraf = require('../promised/rimraf')
let log = require('../util/log')('tasks/uninstall')

let CaveStore = require('../stores/cave-store')
let AppActions = require('../actions/app-actions')

let core = require('./install/core')

function ensure (predicate, reason) {
  if (!predicate) {
    throw new Error(reason)
  }
}

let self = {
  start: async function (opts) {
    let id = opts.id
    let logger = opts.logger
    let onerror = opts.onerror || noop
    let onprogress = opts.onprogress || onprogress

    try {
      let cave = await CaveStore.find(id)

      ensure(cave.upload_id, 'need upload id')
      ensure(cave.uploads, 'need cached uploads')

      let upload = cave.uploads[cave.upload_id]
      ensure(upload, 'need upload in upload cache')

      let dest_path = CaveStore.app_path(id)
      let archive_path = CaveStore.archive_path(upload)

      let core_opts = { logger, onerror, onprogress, archive_path, dest_path }

      AppActions.cave_update(id, {launchable: false})
      await core.uninstall(core_opts)
      await rimraf(archive_path, {
        disableGlob: true // rm -rf + globs sound like the kind of evening I don't like
      })
    } catch (e) {
      log(opts, `Something went wrong during uninstall: ${e.stack || e}`)
      log(opts, `Imploding anyway.`)
    }

    AppActions.cave_implode(id)
  }
}

module.exports = self
