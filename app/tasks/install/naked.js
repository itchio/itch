
let log = require('../../util/log')('install/naked')
let rimraf = require('../../promised/rimraf')
let mkdirp = require('../../promised/mkdirp')

let fs = require('fs')
let path = require('path')

function cp (source, target) {
  return new Promise(function (resolve, reject) {
    var rd = fs.createReadStream(source)
    rd.on('error', reject)
    var wr = fs.createWriteStream(target)
    wr.on('error', reject)
    wr.on('finish', resolve)
    rd.pipe(wr)
  })
}

let self = {
  install: async function (opts) {
    let archive_path = opts.archive_path
    let dest_path = opts.dest_path

    await mkdirp(dest_path)

    let dest_file_path = path.join(dest_path, path.basename(archive_path))
    log(opts, `copying ${archive_path} to ${dest_file_path}`)

    await cp(archive_path, dest_file_path)
  },

  uninstall: async function (opts) {
    let dest_path = opts.dest_path

    log(opts, `nuking ${dest_path}`)

    await rimraf(dest_path, {
      disableGlob: true // rm -rf + globs sound like the kind of evening I don't like
    })
  }
}

module.exports = self
