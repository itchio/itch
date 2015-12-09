'use nodent';'use strict'

let Transition = require('./errors').Transition

let noop = require('../util/noop')

let CaveStore = require('../stores/cave-store')
let AppActions = require('../actions/app-actions')

let core = require('./installers/core')

function ensure (predicate, reason) {
  if (!predicate) {
    throw new Transition({
      to: 'find-upload',
      reason
    })
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

    let archive_path = CaveStore.archive_path(upload)
    let dest_path = CaveStore.app_path(id)
    let extract_opts = { logger, onerror, onprogress, archive_path, dest_path }

    AppActions.cave_update(id, {launchable: false})
    await core.install(extract_opts)
    AppActions.cave_update(id, {launchable: true})
  }
}

module.exports = self
