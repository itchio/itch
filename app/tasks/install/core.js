'use nodent';'use strict'

let log = require('../../util/log')('tasks/install')
let sniff = require('../../util/sniff')

let archive = require('./archive')
let msi = require('./msi')
let generic = require('./generic')

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

  async function (opts) {
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
  }
}

module.exports = self
