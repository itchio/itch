
import invariant from 'invariant'

import mklog from '../../util/log'
const log = mklog('download')

import client from '../../util/api'

import downloadPatches from './download-patches'
import resilientDownload from './resilient-download'

export default async function start (out, opts) {
  let res
  let running = true

  while (running) {
    try {
      res = await tryDownload(out, opts)
      running = false
    } catch (err) {
      if (err === 'unexpected EOF') {
        // retry!
      } else {
        // pass on error
        throw err
      }
    }
  }

  return res
}

async function tryDownload (out, opts) {
  if (opts.upgradePath) {
    log(opts, 'Got an upgrade path, downloading patches')
    return await downloadPatches(out, opts)
  }

  const {upload, gameId, destPath, downloadKey, credentials} = opts
  invariant(gameId, 'startDownload opts must be linked to gameId')
  invariant(typeof upload === 'object', 'startDownload opts must have upload object')
  invariant(typeof destPath === 'string', 'startDownload opts must have a dest path')
  invariant(credentials && credentials.key, 'startDownload must have valid API credentials')

  // Get download URL
  const api = client.withKey(credentials.key)

  const getURL = async function () {
    let url
    try {
      url = (await api.downloadUpload(downloadKey, upload.id)).url
    } catch (e) {
      if (e.errors && e.errors[0] === 'invalid upload') {
        const e = new Error('invalid upload')
        e.itchReason = 'upload-gone'
        throw e
      }
      throw e
    }
    return url
  }
  const url = await getURL()

  await resilientDownload(out, {
    ...opts,
    url,
    refreshURL: getURL
  })
}
