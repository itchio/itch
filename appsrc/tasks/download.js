
import Promise from 'bluebird'

import invariant from 'invariant'
import path from 'path'

import sf from '../util/sf'
import pathmaker from '../util/pathmaker'

import mklog from '../util/log'
const log = mklog('tasks/download')

import client from '../util/api'

import butler from '../util/butler'
import urlParser from 'url'

import apply from './apply'

async function downloadPatches (out, opts) {
  const {globalMarket, cave, gameId, totalSize, upgradePath, upload, logger, credentials, downloadKey} = opts
  invariant(typeof globalMarket === 'object', 'downloadPatches must have globalMarket')
  invariant(typeof gameId === 'number', 'downloadPatches must have gameId')
  invariant(typeof upgradePath === 'object', 'downloadPatches must have an upgradePath')
  invariant(typeof totalSize === 'number', 'downloadPatches must have a totalSize')
  invariant(typeof upload === 'object', 'downloadPatches must have upload object')
  invariant(typeof cave === 'object', 'downloadPatches must have cave')
  invariant(credentials && credentials.key, 'downloadPatches has valid key')

  const emitter = out

  let previousPatch
  let byteOffset = 0

  const cavePath = pathmaker.appPath(cave)

  const doApply = async function (patch) {
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
    await apply(out, applyOpts)
    log(opts, `Done applying ${patch.entry.id}`)
  }

  for (const entry of upgradePath) {
    log(opts, `Dealing with entry ${JSON.stringify(entry, null, 2)}`)

    const promises = []
    if (previousPatch) {
      promises.push(doApply(previousPatch))
    }

    promises.push((async function () {
      const patchPath = pathmaker.downloadPath({
        ...upload,
        filename: 'patch.pwr',
        buildId: entry.id
      })
      const signaturePath = patchPath + '.sig'
      log(opts, `Downloading build ${entry.id}'s patch to ${patchPath}`)

      const onProgress = (payload) => {
        out.emit('progress', (byteOffset + (payload.percent / 100 * entry.patchSize)) / totalSize)
      }
      log(opts, `byteOffset = ${byteOffset}, entry.patchSize = ${entry.patchSize}`)

      const api = client.withKey(credentials.key)
      const buildRes = await api.downloadBuild(downloadKey, upload.id, entry.id)

      log(opts, 'got signature + patch download urls')

      await Promise.all([
        butler.dl({url: buildRes.patch.url, dest: patchPath, onProgress, emitter}),
        butler.dl({url: buildRes.signature.url, dest: signaturePath, emitter})
      ])
      log(opts, 'downloaded both patch + signature')

      previousPatch = { entry, patchPath, signaturePath, byteOffset }
      byteOffset += entry.patchSize

      const progress = byteOffset / totalSize
      out.emit('progress', progress)
    })())

    await Promise.all(promises)
  }

  out.emit('progress', 1)
  await doApply(previousPatch)
  log(opts, 'All done applying!')
}

export default async function start (out, opts) {
  if (opts.upgradePath) {
    log(opts, 'Got an upgrade path, downloading patches')
    return await downloadPatches(out, opts)
  }

  const {upload, gameId, destPath, downloadKey, credentials} = opts
  invariant(gameId, 'startDownload opts must be linked to gameId')
  invariant(typeof upload === 'object', 'startDownload opts must have upload object')
  invariant(typeof destPath === 'string', 'startDownload opts must have a dest path')
  invariant(credentials && credentials.key, 'download has valid key')

  // Get download URL
  const api = client.withKey(credentials.key)

  let url
  try {
    url = (await api.downloadUpload(downloadKey, upload.id)).url
  } catch (e) {
    if (e.errors && e.errors[0] === 'invalid upload') {
      const e = new Error('invalid reason')
      e.itchReason = 'upload-gone'
      throw e
    }
    throw e
  }

  const parsed = urlParser.parse(url)
  log(opts, `downloading from ${parsed.hostname}`)
  log(opts, `downloading to ${destPath}`)

  const onProgress = (payload) => out.emit('progress', payload.percent / 100)

  log(opts, 'starting download!')
  try {
    log(opts, 'making dir')
    await sf.mkdir(path.dirname(destPath))
    log(opts, 'butler download')
    await butler.dl({url, dest: destPath, onProgress, emitter: out})
  } catch (err) {
    log(opts, `couldn't finish download: ${err.message || err}`)
    throw err
  }

  log(opts, 'finished')
}
