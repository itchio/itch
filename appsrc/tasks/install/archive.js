
import subprogress from '../../util/subprogress'
import sniff from '../../util/sniff'
import noop from '../../util/noop'

import butler from '../../util/butler'
import extract from '../../util/extract'
import deploy from '../../util/deploy'

import core from './core'

import mklog from '../../util/log'
const log = mklog('installers/archive')

import AppActions from '../../actions/app-actions'

const isTar = async function (path) {
  const type = await sniff.path(path)
  return type && type.ext === 'tar'
}

const self = {
  retrieveCachedType: function (opts) {
    const {cave} = opts
    if (!cave) {
      return
    }
    log(opts, `got cave: ${JSON.stringify(cave, null, 2)}`)

    const {archiveNestedCache = {}} = cave
    const type = archiveNestedCache[cave.uploadId]
    if (!type) {
      return
    }

    log(opts, `found cached installer type ${type}`)

    if (core.validInstallers.indexOf(type) === -1) {
      log(opts, `invalid exe type stored: ${type} - discarding`)
      return null
    }

    return type
  },

  cacheType: function (opts, type) {
    const cave = opts.cave
    if (!cave) return

    const archiveNestedCache = {}
    archiveNestedCache[cave.uploadId] = type
    AppActions.update_cave(cave.id, {archiveNestedCache})
  },

  install: async function (opts) {
    const archivePath = opts.archivePath

    const onProgress = opts.onProgress || noop
    const extract_onProgress = subprogress(onProgress, 0, 80)
    const deploy_onProgress = subprogress(onProgress, 80, 100)

    const stagePath = opts.archivePath + '-stage'
    await butler.wipe(stagePath)
    await butler.mkdir(stagePath)

    log(opts, `extracting archive '${archivePath}' to '${stagePath}'`)

    const extractOpts = Object.assign({}, opts, {
      onProgress: extract_onProgress,
      destPath: stagePath
    })
    await extract.extract(extractOpts)

    log(opts, `extracted all files ${archivePath} into staging area`)

    const deployOpts = Object.assign({}, opts, {
      onProgress: deploy_onProgress,
      stagePath
    })

    deployOpts.onSingle = async (only_file) => {
      if (!opts.tar && await isTar(only_file)) {
        return await self.handleTar(deployOpts, only_file)
      }

      return await self.handleNested(opts, only_file)
    }

    await deploy.deploy(deployOpts)

    log(opts, `wiping stage...`)
    await butler.wipe(stagePath)
    log(opts, `done wiping stage`)

    return {status: 'ok'}
  },

  uninstall: async function (opts) {
    const destPath = opts.destPath

    const installerName = self.retrieve_cached_type(opts)
    if (installerName) {
      log(opts, `have nested installer type ${installerName}, running...`)
      const coreOpts = Object.assign({}, opts, {installerName})
      await core.uninstall(coreOpts)
    } else {
      log(opts, `wiping directory ${destPath}`)
      await butler.wipe(destPath)
    }

    log(opts, `cleaning up cache`)
    self.cacheType(opts, null)
  },

  handle_tar: async function (opts, tar) {
    // Files in .tar.gz, .tar.bz2, etc. need a second 7-zip invocation
    log(opts, `extracting tar: ${tar}`)
    const subOpts = Object.assign({}, opts, {
      archivePath: tar,
      tar: true
    })

    await self.install(subOpts)
    await butler.wipe(tar)

    return {deployed: true}
  },

  handle_nested: async function (opts, only_file) {
    // zipped installers need love too
    const sniffOpts = {archivePath: only_file, disable_cache: true}

    let installer_name
    try {
      installer_name = await core.sniff_type(sniffOpts)
    } catch (err) {
      log(opts, `not a recognized installer type: ${only_file}`)
      return null
    }

    self.cache_type(opts, installer_name)
    log(opts, `found a '${installer_name}': ${only_file}`)
    const nestedOpts = Object.assign({}, opts, sniffOpts)
    log(opts, `installing it with nestedOpts: ${JSON.stringify(nestedOpts, null, 2)}`)
    await core.install(nestedOpts)

    return {deployed: true}
  }
}

export default self
