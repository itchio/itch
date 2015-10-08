
import file_type from 'file-type'
import read_chunk from 'read-chunk'
import path from 'path'
import assign from 'object-assign'
import SevenZip from 'node-7z'

import glob from '../util/glob'
import fs from '../util/fs'
import noop from '../util/noop'

let log = require('../util/log')('7zip')

function normalize (p) {
  return path.normalize(p.replace(/[\s]*$/, ''))
}

function is_tar (file) {
  let type = file_type(read_chunk.sync(file, 0, 262))
  return type && type.ext === 'tar'
}

function list_files (archive_path) {
  let op = new SevenZip().list(archive_path)
  let sizes = {}
  let total_size = 0
  op.progress((files) => {
    for (let f of files) {
      total_size += f.size
      sizes[normalize(f.name)] = f.size
    }
  })
  return op.then((spec) => ({ sizes, total_size }))
}

export function extract (opts) {
  let {archive_path, dest_path, onprogress = noop} = opts

  log(`Extracting archive '${archive_path}' to '${dest_path}' with 7-Zip`)

  let extracted_size = 0
  let total_size = 0

  return (
    list_files(archive_path).then((info) => {
      console.log(`Done listing files, info = ${JSON.stringify(info)}`)
      total_size = info.total_size
      let {sizes} = info

      let op = new SevenZip().extractFull(archive_path, dest_path)
      op.progress((files) => {
        for (let f of files) {
          extracted_size += sizes[normalize(f)] || 0
        }
        let percent = extracted_size / total_size * 100
        onprogress({ extracted_size, total_size, percent })
      })
      return op
    }).then(() =>
      glob(`${dest_path}/**/*`, {nodir: true})
    ).then((files) => {
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

      let percent = 100
      let status = { extracted_size, total_size, percent }
      onprogress(status)
      return status
    })
  )
}
