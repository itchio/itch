
import Promise from 'bluebird'
import SevenZip from 'node-7z'
import path from 'path'

import {is_tar} from '../../util/sniff'
import noop from '../../util/noop'

import glob from '../../promised/glob'
import mkdirp from '../../promised/mkdirp'
import fs from '../../promised/fs'

let log = require('../../util/log')('7zip')

let self = {
  normalize: function (p) {
    return path.normalize(p.replace(/[\s]*$/, ''))
  },

  sevenzip_list: function (archive_path) {
    return new Promise((resolve, reject) => {
      let op = new SevenZip().list(archive_path)
      let sizes = {}
      let total_size = 0
      op.progress((files) => {
        for (let f of files) {
          total_size += f.size
          sizes[self.normalize(f.name)] = f.size
        }
      })
      op.then((r) => resolve({ sizes, total_size }))
      op.catch((e) => reject(e))
    })
  },

  sevenzip_extract: function (archive_path, dest_path, onprogress) {
    return mkdirp(dest_path).then(() => {
      return new Promise((resolve, reject) => {
        let op = new SevenZip().extractFull(archive_path, dest_path)
        op.progress(onprogress)
        op.then((r) => resolve(r))
        op.catch((e) => reject(e))
      })
    })
  },

  extract: function (opts) {
    let {archive_path, dest_path, onprogress = noop} = opts

    log(opts, `Extracting archive '${archive_path}' to '${dest_path}' with 7-Zip`)

    let extracted_size = 0
    let total_size = 0

    return (
      self.sevenzip_list(archive_path).then((info) => {
        total_size = info.total_size
        log(opts, `Archive contains ${Object.keys(info.sizes).length} files, ${total_size} total`)

        let sevenzip_progress = (files) => {
          files.forEach((f) => extracted_size += (info.sizes[self.normalize(f)] || 0))
          let percent = extracted_size / total_size * 100
          onprogress({ extracted_size, total_size, percent })
        }
        return self.sevenzip_extract(archive_path, dest_path, sevenzip_progress)
      }).then((res) => {
        log(opts, `Done extracting! res = ${JSON.stringify(res)}`)
        return glob(`${dest_path}/**/*`, {nodir: true})
      }).then((files) => {
        // Files in .tar.gz, .tar.bz2, etc. need a second 7-zip invocation
        if (files.length === 1) {
          return is_tar(files[0]).then(is => {
            if (!is) return { extracted_size, total_size }

            log(opts, `Found tar: ${files[0]}, re-extracting`)
            let tar = files[0]
            let sub_opts = Object.assign({}, opts, {archive_path: tar})
            return (
              self.extract(sub_opts)
              .then((res) => {
                return fs.unlinkAsync(tar).then(() => res)
              })
            )
          })
        } else {
          return { extracted_size, total_size }
        }
      })
    )
  }
}

export default self
