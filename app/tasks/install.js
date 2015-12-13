'use strict'

let errors = require('./errors')

let noop = require('../util/noop')
let fs = require('../promised/fs')
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
    let onprogress = opts.onprogress || onprogress

    let cave = await CaveStore.find(id)

    ensure(cave.upload_id, 'need upload id')
    ensure(cave.uploads, 'need cached uploads')

    let upload = cave.uploads[cave.upload_id]
    ensure(upload, 'need upload in upload cache')

    let dest_path = CaveStore.app_path(id)
    let archive_path = CaveStore.archive_path(upload)

    let imtime = cave.installed_archive_mtime
    let amtime = (await fs.lstatAsync(archive_path)).mtime
    log(opts, `comparing mtimes, installed = ${imtime}, archive = ${amtime}`)

    if (imtime && !(amtime > imtime)) {
      log(opts, `archive isn't more recent, nothing to install`)
      return
    }

    let core_opts = { logger, onerror, onprogress, archive_path, dest_path }

    AppActions.cave_update(id, {launchable: false})
    await core.install(core_opts)
    AppActions.cave_update(id, {launchable: true, installed_archive_mtime: amtime})
  }
}

module.exports = self
