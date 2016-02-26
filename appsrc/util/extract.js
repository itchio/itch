
import { object } from 'underline'

let humanize = require('humanize-plus')
let path = require('path')

let log = require('./log')('util/extract')

let verbose = (process.env.THE_DEPTHS_OF_THE_SOUL === '1')

let formulas = require('./ibrew/formulas')
let version = require('./ibrew/version')

let os = require('./os')
let noop = require('./noop')
let sf = require('./sf')
let spawn = require('./spawn')
let sniff = require('./sniff')
let butler = require('./butler')

let self = {
  sevenzip_list: async function (command, v, logger, archive_path) {
    let opts = {logger}
    let sizes = {}
    let total_size = 0

    await spawn({
      command,
      args: ['-slt', 'l', archive_path],
      split: '\n\n',
      ontoken: (token) => {
        let item = token.split('\n').map((x) => x.replace(/\r$/, '').split(' = '))::object()
        if (!item.Size || !item.Path) return
        if (verbose) {
          log(opts, `list: ${item.Size} | ${item.Path}`)
        }
        let item_path = path.normalize(item.Path)
        let size = parseInt(item.Size, 10)

        total_size += (sizes[item_path] = size)
      },
      logger
    })
    return {sizes, total_size}
  },

  sevenzip_extract: async function (command, v, logger, archive_path, dest_path, onprogress) {
    let opts = {logger}
    let err_state = false
    let err

    let EXTRACT_RE = /^Extracting\s+(.+)$/
    let additional_args = []

    if (/^15/.test(v)) {
      EXTRACT_RE = /^-\s(.+)$/
      additional_args.push('-bb1')
    }

    await sf.mkdir(dest_path)
    await spawn({
      command,
      args: ['x', archive_path, '-o' + dest_path, '-y'].concat(additional_args),
      split: '\n',
      ontoken: (token) => {
        if (verbose) {
          log(opts, `extract: ${token}`)
        }
        if (err_state) {
          if (!err) err = token
          return
        }
        if (token.match(/^Error:/)) {
          err_state = 1
          return
        }

        let matches = EXTRACT_RE.exec(token)
        if (!matches) return

        let item_path = path.normalize(matches[1])
        onprogress(item_path)
      },
      logger
    })

    if (err) throw err
  },

  sevenzip: async (opts) => {
    let archive_path = opts.archive_path
    let dest_path = opts.dest_path
    let onprogress = opts.onprogress || noop
    let command = opts.sevenzip || '7za'
    let logger = opts.logger

    let check = formulas['7za'].version_check
    let sevenzip_info = await os.assert_presence('7za', check.args, check.parser)
    let v = version.normalize(sevenzip_info.parsed)

    log(opts, `using 7-zip version ${v}`)

    let extracted_size = 0
    let total_size = 0

    let info = await self.sevenzip_list(command, v, logger, archive_path)
    total_size = info.total_size
    log(opts, `archive contains ${Object.keys(info.sizes).length} files, ${humanize.fileSize(total_size)} total`)

    let sevenzip_progress = (f) => {
      extracted_size += (info.sizes[f] || 0)
      let percent = extracted_size / total_size * 100
      onprogress({ extracted_size, total_size, percent })
    }
    await self.sevenzip_extract(command, v, logger, archive_path, dest_path, sevenzip_progress)
  },

  extract: async (opts) => {
    pre: { // eslint-disable-line
      typeof opts === 'object'
      typeof opts.archive_path === 'string'
      typeof opts.dest_path === 'string'
    }

    let archive_path = opts.archive_path

    let type = await sniff.path(archive_path)
    if (type.ext === 'tar') {
      log(opts, `using butler`)
      return await butler.untar(opts)
    } else {
      return await self.sevenzip(opts)
    }
  }
}

module.exports = self
