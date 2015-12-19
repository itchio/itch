'use strict'

let log = require('../../util/log')('tasks/install')
let sniff = require('../../util/sniff')

let archive = require('./archive')
let msi = require('./msi')
let exe = require('./exe')

let self = {
  installer_for_ext: {
    // Generic archives
    'zip': archive,
    'gz': archive,
    'bz2': archive,
    '7z': archive,
    'tar': archive,
    'xz': archive,
    // Microsoft packages
    'msi': msi,
    // Inno setup, NSIS
    'exe': exe
  },

  install: async function (opts) {
    return await self.operate(opts, 'install')
  },

  uninstall: async function (opts) {
    return await self.operate(opts, 'uninstall')
  },

  operate: async function (opts, operation) {
    let archive_path = opts.archive_path
    let type = await sniff.path(archive_path)

    if (!type) throw new Error(`don't know how to ${operation} ${archive_path}`)

    log(opts, `type of ${archive_path}: ${JSON.stringify(type)}`)

    let installer = self.installer_for_ext[type.ext]
    if (installer) {
      await installer[operation](opts)
    } else {
      throw new Error(`don't know how to ${operation} ${archive_path}: ${JSON.stringify(type)}`)
    }
  }
}

module.exports = self
