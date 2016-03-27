
import subprogress from '../../util/subprogress'
import sniff from '../../util/sniff'
import noop from '../../util/noop'

import butler from '../../util/butler'
import extract from '../../util/extract'
import deploy from '../../util/deploy'

import core from './core'

import mklog from '../../util/log'
const log = mklog('installers/archive')

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
    const {globalMarket} = opts
    globalMarket.saveEntity('caves', cave.id, {archiveNestedCache})
  },

  install: async function (out, opts) {
    const archivePath = opts.archivePath

    const onProgress = opts.onProgress || noop
    const extractOnProgress = subprogress(onProgress, 0, 80)
    const deployOnProgress = subprogress(onProgress, 80, 100)

    const stagePath = opts.archivePath + '-stage'
    await butler.wipe(stagePath)
    await butler.mkdir(stagePath)

    log(opts, `extracting archive '${archivePath}' to '${stagePath}'`)

    const extractOpts = Object.assign({}, opts, {
      onProgress: extractOnProgress,
      destPath: stagePath
    })
    await extract.extract(extractOpts)

    log(opts, `extracted all files ${archivePath} into staging area`)

    const deployOpts = Object.assign({}, opts, {
      onProgress: deployOnProgress,
      stagePath
    })

    deployOpts.onSingle = async (onlyFile) => {
      if (!opts.tar && await isTar(onlyFile)) {
        return await self.handleTar(deployOpts, onlyFile)
      }

      return await self.handleNested(out, opts, onlyFile)
    }

    await deploy.deploy(deployOpts)

    log(opts, `wiping stage...`)
    await butler.wipe(stagePath)
    log(opts, `done wiping stage`)

    return {status: 'ok'}
  },

  uninstall: async function (out, opts) {
    const destPath = opts.destPath

    const installerName = self.retrieveCachedType(opts)
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

  handleTar: async function (opts, tar) {
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

  handleNested: async function (out, opts, onlyFile) {
    // zipped installers need love too
    const sniffOpts = {archivePath: onlyFile, disableCache: true}

    let installerName
    try {
      installerName = await core.sniffType(sniffOpts)
    } catch (err) {
      log(opts, `not a recognized installer type: ${onlyFile}`)
      return null
    }

    self.cacheType(opts, installerName)
    log(opts, `found a '${installerName}': ${onlyFile}`)
    const nestedOpts = Object.assign({}, opts, sniffOpts)
    log(opts, `installing it with nestedOpts: ${JSON.stringify(nestedOpts, null, 2)}`)
    await core.install(out, nestedOpts)

    return {deployed: true}
  }
}

export default self
