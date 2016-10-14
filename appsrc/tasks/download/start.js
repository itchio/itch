
import invariant from 'invariant'

import mklog from '../../util/log'
const log = mklog('download')

import pathmaker from '../../util/pathmaker'
import client from '../../util/api'
import butler from '../../util/butler'

import downloadPatches from './download-patches'

export default async function start (out, opts) {
  if (opts.upgradePath) {
    log(opts, 'Got an upgrade path, downloading patches')
    return await downloadPatches(out, opts)
  }

  const {upload, gameId, destPath, downloadKey, credentials} = opts
  invariant(gameId, 'startDownload opts must have gameId')
  invariant(typeof upload === 'object', 'startDownload opts must have upload object')
  invariant(typeof destPath === 'string', 'startDownload opts must have a dest path')
  invariant(credentials && credentials.key, 'startDownload must have valid API credentials')

  const api = client.withKey(credentials.key)

  const onProgress = (e) => out.emit('progress', e)

  if (upload.buildId) {
    log(opts, `Downloading wharf-enabled upload, build #${upload.buildId}`)

    const {game} = opts
    invariant(game, 'startDownload opts must have game')

    // TODO: use manifest URL if available
    const archiveURL = api.downloadBuildURL(downloadKey, upload.id, upload.buildId, 'archive')
    const signatureURL = api.downloadBuildURL(downloadKey, upload.id, upload.buildId, 'signature')

    const store = require('../../store').default
    const {defaultInstallLocation} = store.getState().preferences
    const installLocation = defaultInstallLocation
    const installFolder = pathmaker.sanitize(game.title)

    const cave = {
      installLocation,
      installFolder,
      pathScheme: 2 // see pathmaker
    }

    const fullInstallFolder = pathmaker.appPath(cave)
    log(opts, `Doing decompressing download to ${fullInstallFolder}`)

    await butler.verify(signatureURL, fullInstallFolder, {
      ...opts,
      heal: `archive,${archiveURL}`,
      emitter: out,
      onProgress
    })
  } else {
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
}
