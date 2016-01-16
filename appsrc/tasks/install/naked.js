
let log = require('../../util/log')('install/naked')
let sf = require('../../util/sf')

let path = require('path')

let self = {
  install: async function (opts) {
    let archive_path = opts.archive_path
    let dest_path = opts.dest_path

    await sf.mkdir(dest_path)

    let dest_file_path = path.join(dest_path, path.basename(archive_path))
    log(opts, `copying ${archive_path} to ${dest_file_path}`)

    await sf.ditto(archive_path, dest_file_path)
  },

  uninstall: async function (opts) {
    let dest_path = opts.dest_path

    log(opts, `nuking ${dest_path}`)
    await sf.wipe(dest_path)
  }
}

module.exports = self
