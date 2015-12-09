'use nodent';'use strict'

let Transition = require('./errors').Transition

let sniff = require('../util/sniff')
let noop = require('../util/noop')
let log = require('../util/log')('tasks/install')

let CaveStore = require('../stores/cave-store')
let AppActions = require('../actions/app-actions')

let archive = require('./installers/archive')
let msi = require('./installers/msi')
let generic = require('./installers/generic')

function ensure (predicate, reason) {
  if (!predicate) {
    throw new Transition({
      to: 'find-upload',
      reason
    })
  }
}

let self = {
  installer_for_ext: {
    // Generic archives
    'zip': archive,
    'gz': archive,
    'bz2': archive,
    '7z': archive,
    // Microsoft packages
    'msi': msi,
    // Inno setup, NSIS
    'exe': generic
  },

  install: async function (opts) {
    let archive_path = opts.archive_path
    let type = await sniff.path(archive_path)

    if (!type) throw new Error(`don't know how to install ${archive_path}`)

    log(opts, `type of ${archive_path}: ${JSON.stringify(type)}`)

    let installer = self.installer_for_ext[type.ext]
    if (installer) {
      await installer.install(opts)
    } else {
      throw new Error(`don't know how to install ${archive_path}: ${JSON.stringify(type)}`)
    }
  },

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
    await self.install(extract_opts)
    AppActions.cave_update(id, {launchable: true})
  }
}

module.exports = self
