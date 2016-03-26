
import invariant from 'invariant'
import path from 'path'

import sf from '../util/sf'

import mklog from '../util/log'
const log = mklog('tasks/download')

import client from '../util/api'

import butler from '../util/butler'
import urlParser from 'url'

export default async function start (out, opts) {
  const {upload, gameId, destPath, downloadKey, credentials} = opts
  invariant(gameId, 'startDownload opts must be linked to gameId')
  invariant(typeof upload === 'object', 'startDownload opts must have upload object')
  invariant(typeof destPath === 'string', 'startDownload opts must have a dest path')
  invariant(credentials && credentials.key, 'download has valid key')

  // Get download URL
  const keyClient = client.withKey(credentials.key)

  let url
  try {
    if (downloadKey) {
      url = (await keyClient.downloadUploadWithKey(downloadKey.id, upload.id)).url
    } else {
      url = (await keyClient.downloadUpload(upload.id)).url
    }
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
    await butler.dl({url, dest: destPath, onProgress})
  } catch (err) {
    log(opts, `couldn't finish download: ${err.message || err}`)
    throw err
  }

  log(opts, 'finished')
}
