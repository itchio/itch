
import invariant from 'invariant'

import Promise from 'bluebird'
import {EventEmitter} from 'events'
import {map} from 'underline'

import pathmaker from '../../util/pathmaker'
import client from '../../util/api'

import mklog from '../../util/log'
const log = mklog('download-patches')

import apply from './apply'
import resilientDownload from './resilient-download'

export default async function downloadPatches (out, opts) {
  const {globalMarket, cave, gameId, totalSize, upgradePath, upload, credentials} = opts
  invariant(typeof globalMarket === 'object', 'downloadPatches must have globalMarket')
  invariant(typeof gameId === 'number', 'downloadPatches must have gameId')
  invariant(typeof upgradePath === 'object', 'downloadPatches must have an upgradePath')
  invariant(typeof totalSize === 'number', 'downloadPatches must have a totalSize')
  invariant(typeof upload === 'object', 'downloadPatches must have upload object')
  invariant(typeof cave === 'object', 'downloadPatches must have cave')
  invariant(credentials && credentials.key, 'downloadPatches has valid key')

  let previousPatch
  let byteOffset = 0

  for (const entry of upgradePath) {
    log(opts, `Dealing with entry ${JSON.stringify(entry, null, 2)}`)

    const promises = {}
    if (previousPatch) {
      promises.apply = doApply(opts, previousPatch)
    }
    promises.download = doDownloadPatchAndSignature(out, opts, entry, byteOffset, totalSize)

    // await: 1. apply previous patch (if any) 2. download next patch
    const res = await Promise.props(promises)
    previousPatch = res.download

    byteOffset += entry.patchSize
  }

  // FIXME: for large games, this looks like the patching is stuck at 100%
  out.emit('progress', 1)
  await doApply(previousPatch)
  log(opts, 'All done applying!')
}

async function doApply (opts, patch) {
  const {globalMarket, logger, cave, gameId} = opts
  const cavePath = pathmaker.appPath(cave)

  log(opts, `patch entry: ${JSON.stringify(patch.entry, 0, 2)}`)
  log(opts, `Applying ${patch.entry.id} into ${cavePath}`)
  const applyOpts = {
    name: 'apply',
    globalMarket,
    cave,
    gameId,
    buildId: patch.entry.id,
    buildUserVersion: patch.entry.userVersion,
    patchPath: patch.patchPath,
    signaturePath: patch.signaturePath,
    outPath: cavePath,
    logger
  }
  await apply(applyOpts)
  log(opts, `Done applying ${patch.entry.id}`)
}

async function doDownloadPatchAndSignature (out, opts, entry, byteOffset, totalSize) {
  const {credentials} = opts
  invariant(credentials && credentials.key, 'doDownloadPatchAndSignature has valid API key')
  const api = client.withKey(credentials.key)

  const {upload} = opts
  invariant(upload, 'doDownloadPatchAndSignature has upload')

  const {downloadKey} = opts
  invariant(downloadKey, 'doDownloadPatchAndSignature has valid download key')

  const paths = {}
  paths.patch = pathmaker.downloadPath({
    ...upload,
    filename: 'patch.pwr',
    buildId: entry.id
  })
  paths.signature = paths.patch + '.sig'

  log(opts, `Downloading build ${entry.id}'s patch to ${paths.patch}`)

  const downloadEmitter = new EventEmitter()
  downloadEmitter.on('progress', (progress) => {
    out.emit('progress', (byteOffset + (progress * entry.patchSize)) / totalSize)
  })

  log(opts, `byteOffset = ${byteOffset}, entry.patchSize = ${entry.patchSize}`)

  const getURLs = async function () {
    return await api.downloadBuild(downloadKey, upload.id, entry.id)
  }
  const urls = await getURLs()

  const promises = ['patch', 'signature']::map((fileType) => {
    const opts = {
      url: urls[fileType].url,
      refreshURL: async function () {
        return (await getURLs()).patch.url
      },
      dest: paths[fileType]
    }

    let downloadOut = null
    // size of signature is not significant compared to patch,
    // so we only use patch size as progress meter
    if (fileType === 'patch') {
      downloadOut = downloadEmitter
    }
    return resilientDownload(downloadOut, opts)
  })

  await Promise.all(promises)
  log(opts, 'downloaded both patch + signature')

  const progress = (byteOffset + entry.patchSize) / totalSize
  out.emit('progress', progress)

  return {
    entry,
    patchPath: paths.patch,
    signaturePath: paths.signature, byteOffset
  }
}
