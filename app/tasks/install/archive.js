
let _ = require('underscore')
let humanize = require('humanize-plus')
let Promise = require('bluebird')
let path = require('path')

let subprogress = require('../../util/subprogress')
let sniff = require('../../util/sniff')
let noop = require('../../util/noop')
let spawn = require('../../util/spawn')

let sf = require('../../util/sf')
let core = require('./core')

let log = require('../../util/log')('installers/archive')

let AppActions = require('../../actions/app-actions')

let is_tar = async function (path) {
  let type = await sniff.path(path)
  return type && type.ext === 'tar'
}

let verbose = (process.env.THE_DEPTHS_OF_THE_SOUL === '1')

let self = {
  retrieve_cached_type: function (opts) {
    let cave = opts.cave
    if (!cave) return
    log(opts, `got cave: ${JSON.stringify(cave, null, 2)}`)

    let archive_nested_cache = cave.archive_nested_cache || {}
    let type = archive_nested_cache[cave.upload_id]
    log(opts, `found cached installer type ${type}`)

    if (core.valid_installers.indexOf(type) === -1) {
      log(opts, `invalid exe type stored: ${type} - discarding`)
      return null
    }

    return type
  },

  cache_type: function (opts, type) {
    let cave = opts.cave
    if (!cave) return

    let archive_nested_cache = {}
    archive_nested_cache[cave.upload_id] = type
    AppActions.cave_update(cave._id, {archive_nested_cache})
  },

  sevenzip_list: async function (version, logger, archive_path) {
    let opts = {logger}
    let sizes = {}
    let total_size = 0

    await spawn({
      command: '7za',
      args: ['-slt', 'l', archive_path],
      split: '\n\n',
      ontoken: (token) => {
        let item = _.object(token.split('\n').map((x) => x.replace(/\r$/, '').split(' = ')))
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

  sevenzip_extract: async function (version, logger, archive_path, dest_path, onprogress) {
    let opts = {logger}
    let err_state = false
    let err

    let EXTRACT_RE = /^Extracting\s+(.+)$/
    let additional_args = []

    if (/^15/.test(version)) {
      EXTRACT_RE = /^-\s(.+)$/
      additional_args.push('-bb1')
    }

    await sf.mkdir(dest_path)
    await spawn({
      command: '7za',
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

  install: async function (opts) {
    let logger = opts.logger
    let archive_path = opts.archive_path
    let dest_path = opts.dest_path
    let onprogress = opts.onprogress || noop

    let stage_path = opts.archive_path + '-stage'
    await sf.wipe(stage_path)
    await sf.mkdir(stage_path)

    log(opts, `extracting archive '${archive_path}' to '${stage_path}'`)

    let ibrew = require('../../util/ibrew')
    let version = await ibrew.get_local_version('7za')
    log(opts, `...using 7-zip version ${version}`)

    let extracted_size = 0
    let total_size = 0

    let info = await self.sevenzip_list(version, logger, archive_path)
    total_size = info.total_size
    log(opts, `archive contains ${Object.keys(info.sizes).length} files, ${humanize.fileSize(total_size)} total`)

    let extract_onprogress = subprogress(onprogress, 0, 80)
    let stagecp_onprogress = subprogress(onprogress, 80, 100)

    let sevenzip_progress = (f) => {
      extracted_size += (info.sizes[f] || 0)
      let percent = extracted_size / total_size * 100
      extract_onprogress({ extracted_size, total_size, percent })
    }
    await self.sevenzip_extract(version, logger, archive_path, stage_path, sevenzip_progress)

    log(opts, `extracted all files ${archive_path} into staging area`)

    let stage_files = await sf.glob('**/*', {cwd: stage_path})

    // Files in .tar.gz, .tar.bz2, etc. need a second 7-zip invocation
    if (stage_files.length === 1) {
      let only_file = path.join(stage_path, stage_files[0])

      if (!opts.tar && await is_tar(only_file)) {
        let tar = only_file
        log(opts, `found tar: ${tar}, re-extracting`)
        let sub_opts = Object.assign({}, opts, {
          archive_path: tar,
          tar: true,
          onprogress: stagecp_onprogress
        })

        let res = await self.install(sub_opts)
        await sf.wipe(tar)
        return res
      } else {
        let sniff_opts = {archive_path: only_file, disable_cache: true}
        let installer_name

        try {
          installer_name = await core.sniff_type(sniff_opts)
        } catch (err) {
          log(opts, `only file isn't a recognized installer type`)
          installer_name = null
        }

        if (installer_name) {
          onprogress({percent: 0})
          self.cache_type(opts, installer_name)
          log(opts, `found nested installer '${installer_name}', going with it!`)
          let nested_opts = Object.assign({}, opts, sniff_opts, {
            onprogress: stagecp_onprogress
          })
          log(opts, `giving nested_opts: ${JSON.stringify(nested_opts, null, 2)}`)
          return await core.install(nested_opts)
        }
      }
    }

    await sf.mkdir(dest_path)

    log(opts, `cleaning up dest path ${dest_path}`)

    // XXX write stage file list when all is said and done / read it back when upgrading
    let receipt_path = path.join(dest_path, '.itch', 'receipt.json')
    let dest_files

    try {
      let receipt_contents = await sf.read_file(receipt_path)
      let receipt = JSON.parse(receipt_contents)
      dest_files = receipt.files
      log(opts, `Got receipt for an existing ${humanize.fileSize(receipt.total_size)} install.`)
    } catch (err) {
      log(opts, `Could not read receipt: ${err.message}`)
    }
    if (!dest_files || !dest_files.length) {
      log(opts, `Globbing for destfiles`)
      dest_files = await sf.glob('**/*', {cwd: dest_path})
    }

    log(opts, `dest has ${dest_files.length} potential dinosaurs`)

    let dinosaurs = _.difference(dest_files, stage_files)
    if (dinosaurs.length) {
      log(opts, `removing ${dinosaurs.length} dinosaurs in dest`)
      log(opts, `example dinosaurs: ${JSON.stringify(dinosaurs.slice(0, 10), null, 2)}`)

      await Promise.resolve(dinosaurs).map((rel) => {
        let dinosaur = path.join(dest_path, rel)
        sf.wipe(dinosaur)
      }, {concurrency: 4})
    } else {
      log(opts, `no dinosaurs`)
    }

    log(opts, `copying stage to dest`)
    await sf.ditto(stage_path, dest_path, {
      onprogress: stagecp_onprogress
    })

    log(opts, `everything copied, writing receipt`)
    let cave = opts.cave || {}

    sf.write_file(receipt_path, JSON.stringify({
      cave,
      total_size,
      num_files: stage_files.length,
      files: stage_files
    }, null, 2))

    log(opts, `wiping stage...`)
    await sf.wipe(stage_path)

    return {extracted_size, total_size}
  },

  uninstall: async function (opts) {
    let dest_path = opts.dest_path

    let installer_name = self.retrieve_cached_type(opts)
    if (installer_name) {
      log(opts, `have nested installer type ${installer_name}, running...`)
      let core_opts = Object.assign({}, opts, {installer_name})
      await core.uninstall(core_opts)
    } else {
      log(opts, `wiping directory ${dest_path}`)
      await sf.wipe(dest_path)
    }

    log(opts, `cleaning up cache`)
    self.cache_type(opts, null)
  }
}

module.exports = self
