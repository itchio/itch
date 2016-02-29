
let errors = require('./errors')

let noop = require('../util/noop')
let sf = require('../util/sf')
let log = require('../util/log')('tasks/install')

let CaveStore = require('../stores/cave-store')
let AppActions = require('../actions/app-actions')

let core = require('./install/core')

function ensure (predicate, reason) {
  if (!predicate) {
    throw new errors.Transition({ to: 'find-upload', reason })
  }
}

let self = {
  start: async function (opts) {
    let id = opts.id
    let logger = opts.logger
    let onerror = opts.onerror || noop
    let onprogress = opts.onprogress || noop
    let emitter = opts.emitter
    let upload_id = opts.upload_id
    let check_timestamps = true

    let cave = CaveStore.find(id)

    if (opts.reinstall) {
      upload_id = cave.upload_id
      check_timestamps = false
    }

    ensure(upload_id, 'need upload id')
    ensure(cave.uploads, 'need cached uploads')

    let upload = cave.uploads[upload_id]
    ensure(upload, 'need upload in upload cache')

    let dest_path = CaveStore.app_path(cave.install_location, id)
    let archive_path = CaveStore.archive_path(cave.install_location, upload)

    let archive_stat
    try {
      archive_stat = await sf.lstat(archive_path)
    } catch (e) {
      log(opts, `where did our archive go? re-downloading...`)
      throw new errors.Transition({to: 'download', reason: 'missing-download'})
    }

    let imtime = cave.installed_archive_mtime
    let amtime = archive_stat.mtime
    log(opts, `comparing mtimes, installed = ${imtime}, archive = ${amtime}`)

    if (check_timestamps && imtime && !(amtime > imtime)) {
      log(opts, `archive isn't more recent, nothing to install`)
      throw new errors.Transition({to: 'idle', reason: 'up-to-date'})
    }

    let core_opts = { id, logger, onerror, onprogress, archive_path, dest_path, cave, emitter, upload_id }

    AppActions.update_cave(id, {launchable: false})
    await core.install(core_opts)
    AppActions.update_cave(id, {launchable: true, installed_archive_mtime: amtime, upload_id})

    throw new errors.Transition({to: 'configure', reason: 'installed'})
  }
}

module.exports = self
