
import Promise from 'bluebird'
import SevenZip from 'node-7z'
import file_type from 'file-type'
import read_chunk from 'read-chunk'
import path from 'path'
import assign from 'object-assign'
import mkdirp from 'mkdirp'

import glob from '../../util/glob'
import fs from '../../util/fs'
import noop from '../../util/noop'

let log = require('../../util/log')('7zip')

function normalize (p) {
  return path.normalize(p.replace(/[\s]*$/, ''))
}

function is_tar (file) {
  let type = file_type(read_chunk.sync(file, 0, 262))
  return type && type.ext === 'tar'
}

function sevenzip_list (archive_path) {
  return new Promise((resolve, reject) => {
    let op = new SevenZip().list(archive_path)
    let sizes = {}
    let total_size = 0
    op.progress((files) => {
      for (let f of files) {
        total_size += f.size
        sizes[normalize(f.name)] = f.size
      }
    })
    op.then((r) => resolve({ sizes, total_size }))
    op.catch((e) => reject(e))
  })
}

function sevenzip_extract (archive_path, dest_path, onprogress) {
  return new Promise((resolve, reject) => {
    mkdirp.sync(dest_path)
    let op = new SevenZip().extractFull(archive_path, dest_path)
    op.progress(onprogress)
    op.then((r) => resolve(r))
    op.catch((e) => reject(e))
  })
}

function extract (opts) {
  let {archive_path, dest_path, onprogress = noop} = opts

  log(opts, `Extracting archive '${archive_path}' to '${dest_path}' with 7-Zip`)

  let extracted_size = 0
  let total_size = 0

  return (
    sevenzip_list(archive_path).then((info) => {
      total_size = info.total_size
      log(opts, `Archive contains ${Object.keys(info.sizes).length} files, ${total_size} total`)

      let sevenzip_progress = (files) => {
        extracted_size += (
          files.map((f) => (info.sizes[f] || 0))
          .reduce((a, b) => a + b)
        )
        let percent = extracted_size / total_size * 100
        onprogress({ extracted_size, total_size, percent })
      }
      return sevenzip_extract(archive_path, dest_path, sevenzip_progress)
    }).then((res) => {
      log(opts, `Done extracting! res = ${JSON.stringify(res)}`)
      return glob(`${dest_path}/**/*`, {nodir: true})
    }).then((files) => {
      // Files in .tar.gz, .tar.bz2, etc. need a second 7-zip invocation
      if (files.length === 1 && is_tar(files[0])) {
        let tar = files[0]
        let sub_opts = assign({}, opts, {archive_path: tar})
        return (
          extract(sub_opts)
          .then((res) => {
            fs.unlinkAsync(tar).then(() => res)
          })
        )
      }

      return { extracted_size, total_size }
    })
  )
}

export default { extract }
