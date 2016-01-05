'use strict'

let path = require('path')
let object = require('underscore').object

let sniff = require('../../util/sniff')
let noop = require('../../util/noop')
let spawn = require('../../util/spawn')

let rimraf = require('../../promised/rimraf')
let glob = require('../../promised/glob')
let mkdirp = require('../../promised/mkdirp')
let fs = require('../../promised/fs')

let log = require('../../util/log')('installers/archive')

let is_tar = async function (path) {
  let type = await sniff.path(path)
  return type && type.ext === 'tar'
}

let self = {
  sevenzip_list: async function (logger, archive_path) {
    let opts = {logger}
    let sizes = {}
    let total_size = 0

    await spawn({
      command: '7za',
      args: ['-slt', 'l', archive_path],
      split: '\n\n',
      ontoken: (token) => {
        log(opts, `7za list: ${token}`)
        let item = object(token.split('\n').map((x) => x.replace(/\r$/, '').split(' = ')))
        if (!item.Size || !item.Path) return
        let item_path = path.normalize(item.Path)
        let size = parseInt(item.Size, 10)

        total_size += (sizes[item_path] = size)
      },
      logger
    })
    return {sizes, total_size}
  },

  sevenzip_extract: async function (logger, archive_path, dest_path, onprogress) {
    let opts = {logger}
    let err_state = false
    let err

    await mkdirp(dest_path)
    await spawn({
      command: '7za',
      args: ['x', archive_path, '-o' + dest_path, '-y'],
      split: '\n',
      ontoken: (token) => {
        log(opts, `7za extract: ${token}`)
        if (err_state) {
          if (!err) err = token
          return
        }
        if (token.match(/^Error:/)) {
          err_state = 1
          return
        }

        let matches = token.match(/^Extracting\s+(.*)$/)
        if (!matches) return

        let item_path = path.normalize(matches[1])
        onprogress(item_path)
      },
      logger
    })

    if (err) throw err
  },

  install: async function (opts) {
    let logger = opts.logger
    let archive_path = opts.archive_path
    let dest_path = opts.dest_path
    let onprogress = opts.onprogress || noop

    log(opts, `Extracting archive '${archive_path}' to '${dest_path}' with 7-Zip`)

    let extracted_size = 0
    let total_size = 0

    let info = await self.sevenzip_list(logger, archive_path)
    total_size = info.total_size
    log(opts, `Archive contains ${Object.keys(info.sizes).length} files, ${total_size} total`)

    let sevenzip_progress = (f) => {
      extracted_size += (info.sizes[f] || 0)
      let percent = extracted_size / total_size * 100
      onprogress({ extracted_size, total_size, percent })
    }
    await self.sevenzip_extract(logger, archive_path, dest_path, sevenzip_progress)

    log(opts, `Done extracting ${archive_path}`)
    let files = await glob(`${dest_path}/**/*`, {nodir: true})

    // Files in .tar.gz, .tar.bz2, etc. need a second 7-zip invocation
    if (files.length === 1 && await is_tar(files[0])) {
      log(opts, `Found tar: ${files[0]}, re-extracting`)
      let tar = files[0]
      let sub_opts = Object.assign({}, opts, {archive_path: tar})

      let res = await self.install(sub_opts)
      await fs.unlinkAsync(tar)
      return res
    }

    return {extracted_size, total_size}
  },

  uninstall: async function (opts) {
    let dest_path = opts.dest_path

    log(opts, `Wiping directory ${dest_path}`)

    await rimraf(dest_path, {
      disableGlob: true // rm -rf + globs sound like the kind of evening I don't like
    })
  }
}

module.exports = self
