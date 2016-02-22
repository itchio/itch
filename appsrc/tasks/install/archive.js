
let subprogress = require('../../util/subprogress')
let sniff = require('../../util/sniff')
let noop = require('../../util/noop')

let butler = require('../../util/butler')
let extract = require('../../util/extract')
let deploy = require('../../util/deploy')

let core = require('./core')

let log = require('../../util/log')('installers/archive')

let AppActions = require('../../actions/app-actions')

let is_tar = async function (path) {
  let type = await sniff.path(path)
  return type && type.ext === 'tar'
}

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
    AppActions.update_cave(cave._id, {archive_nested_cache})
  },

  install: async function (opts) {
    let archive_path = opts.archive_path

    let onprogress = opts.onprogress || noop
    let extract_onprogress = subprogress(onprogress, 0, 80)
    let deploy_onprogress = subprogress(onprogress, 80, 100)

    let stage_path = opts.archive_path + '-stage'
    await butler.wipe(stage_path)
    await butler.mkdir(stage_path)

    log(opts, `extracting archive '${archive_path}' to '${stage_path}'`)

    let extract_opts = Object.assign({}, opts, {
      onprogress: extract_onprogress,
      dest_path: stage_path
    })
    await extract.extract(extract_opts)

    log(opts, `extracted all files ${archive_path} into staging area`)

    let deploy_opts = Object.assign({}, opts, {
      onprogress: deploy_onprogress,
      stage_path
    })

    deploy_opts.onsingle = async (only_file) => {
      if (!opts.tar && await is_tar(only_file)) {
        return await self.handle_tar(deploy_opts, only_file)
      }

      return await self.handle_nested(opts, only_file)
    }

    await deploy.deploy(deploy_opts)

    log(opts, `wiping stage...`)
    await butler.wipe(stage_path)
    log(opts, `done wiping stage`)

    return {status: 'ok'}
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
      await butler.wipe(dest_path)
    }

    log(opts, `cleaning up cache`)
    self.cache_type(opts, null)
  },

  handle_tar: async function (opts, tar) {
    // Files in .tar.gz, .tar.bz2, etc. need a second 7-zip invocation
    log(opts, `extracting tar: ${tar}`)
    let sub_opts = Object.assign({}, opts, {
      archive_path: tar,
      tar: true
    })

    await self.install(sub_opts)
    await butler.wipe(tar)

    return {deployed: true}
  },

  handle_nested: async function (opts, only_file) {
    // zipped installers need love too
    let sniff_opts = {archive_path: only_file, disable_cache: true}
    let installer_name

    try {
      installer_name = await core.sniff_type(sniff_opts)
    } catch (err) {
      log(opts, `not a recognized installer type: ${only_file}`)
      return null
    }

    self.cache_type(opts, installer_name)
    log(opts, `found a '${installer_name}': ${only_file}`)
    let nested_opts = Object.assign({}, opts, sniff_opts)
    log(opts, `installing it with nested_opts: ${JSON.stringify(nested_opts, null, 2)}`)
    await core.install(nested_opts)

    return {deployed: true}
  }
}

module.exports = self
