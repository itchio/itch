
import invariant from 'invariant'

import mklog from '../../util/log'
const log = mklog('download')

import client from '../../util/api'
import butler from '../../util/butler'

import downloadPatches from './download-patches'

export default async function start (out, opts) {
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

  const onProgress = (e) => out.emit('progress', e)
  const uploadURL = api.downloadUploadURL(downloadKey, upload.id)

  try {
    await butler.cp({
      ...opts,
      src: uploadURL,
      dest: destPath,
      resume: true,
      emitter: out,
      onProgress
    })
  } catch (e) {
    if (e.errors && e.errors[0] === 'invalid upload') {
      const e = new Error('invalid upload')
      e.itchReason = 'upload-gone'
      throw e
    }
    throw e
  }
}
