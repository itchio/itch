
import {Transition} from './errors'

import noop from '../util/noop'
import sf from '../util/sf'
import mklog from '../util/log'
const log = mklog('tasks/install')

import CaveStore from '../stores/cave-store'
import AppActions from '../actions/app-actions'

import core from './install/core'

function ensure (predicate, reason) {
  if (!predicate) {
    throw new Transition({to: 'find-upload', reason})
  }
}

let self = {
  start: async function (opts) {
    let id = opts.id
    let logger = opts.logger
    let onerror = opts.onerror || noop
    let onProgress = opts.onProgress || noop
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

    let destPath = CaveStore.appPath(cave.install_location, id)
    let archivePath = CaveStore.archivePath(cave.install_location, upload)

    let archiveStat
    try {
      archiveStat = await sf.lstat(archivePath)
    } catch (e) {
      log(opts, `where did our archive go? re-downloading...`)
      throw new Transition({to: 'download', reason: 'missing-download'})
    }

    let imtime = cave.installedArchiveMtime
    let amtime = archiveStat.mtime
    log(opts, `comparing mtimes, installed = ${imtime}, archive = ${amtime}`)

    if (check_timestamps && imtime && !(amtime > imtime)) {
      log(opts, `archive isn't more recent, nothing to install`)
      throw new Transition({to: 'idle', reason: 'up-to-date'})
    }

    let coreOpts = {id, logger, onerror, onProgress, archivePath, destPath, cave, emitter, upload_id}

    AppActions.update_cave(id, {launchable: false})
    await core.install(coreOpts)
    AppActions.update_cave(id, {launchable: true, installed_archive_mtime: amtime, upload_id})

    throw new Transition({to: 'configure', reason: 'installed'})
  }
}

export default self
