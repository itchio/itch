
import path from 'path'
import {object} from 'underscore'

import {is_tar} from '../../util/sniff'
import noop from '../../util/noop'
import spawn from '../../util/spawn'

import glob from '../../promised/glob'
import mkdirp from '../../promised/mkdirp'
import fs from '../../promised/fs'

let log = require('../../util/log')('7zip')

let self = {
  sevenzip_list: async function (archive_path) {
    let sizes = {}
    let total_size = 0

    await spawn({
      command: '7za',
      args: ['-slt', 'l', archive_path],
      split: '\n\n',
      ontoken: (token) => {
        let item = object(token.split('\n').map((x) => x.replace(/\r$/, '').split(' = ')))
        if (!item.Size || !item.Path) return
        let item_path = path.normalize(item.Path)
        let size = parseInt(item.Size, 10)

        total_size += (sizes[item_path] = size)
      }
    })
    return {sizes, total_size}
  },

  sevenzip_extract: async function (archive_path, dest_path, onprogress) {
    let err_state = false
    let err

    await mkdirp(dest_path)
    await spawn({
      command: '7za',
      args: ['x', archive_path, '-o' + dest_path, '-y'],
      split: '\n',
      ontoken: (token) => {
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
      }
    })

    if (err) throw err
  },

  extract: async function (opts) {
    let {archive_path, dest_path, onprogress = noop} = opts

    log(opts, `Extracting archive '${archive_path}' to '${dest_path}' with 7-Zip`)

    let extracted_size = 0
    let total_size = 0

    let info = await self.sevenzip_list(archive_path)
    total_size = info.total_size
    log(opts, `Archive contains ${Object.keys(info.sizes).length} files, ${total_size} total`)

    let sevenzip_progress = (f) => {
      extracted_size += (info.sizes[f] || 0)
      let percent = extracted_size / total_size * 100
      onprogress({ extracted_size, total_size, percent })
    }
    await self.sevenzip_extract(archive_path, dest_path, sevenzip_progress)

    log(opts, `Done extracting ${archive_path}`)
    let files = await glob(`${dest_path}/**/*`, {nodir: true})

    // Files in .tar.gz, .tar.bz2, etc. need a second 7-zip invocation
    if (files.length === 1 && await is_tar(files[0])) {
      log(opts, `Found tar: ${files[0]}, re-extracting`)
      let tar = files[0]
      let sub_opts = Object.assign({}, opts, {archive_path: tar})

      let res = await self.extract(sub_opts)
      await fs.unlinkAsync(tar)
      return res
    }

    return {extracted_size, total_size}
  }
}

export default self
