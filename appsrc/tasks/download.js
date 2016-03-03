
import {Transition} from './errors'

import mklog from '../util/log'
const log = mklog('tasks/download')

import butler from '../util/butler'
import noop from '../util/noop'
import url_parser from 'url'

import CaveStore from '../stores/cave-store'
import CredentialsStore from '../stores/credentials-store'
import AppActions from '../actions/app-actions'

function ensure (predicate, reason) {
  if (!predicate) {
    throw new Transition({
      to: 'find-upload',
      reason
    })
  }
}

async function start (opts) {
  const {id, onprogress = noop, logger, emitter, upload_id} = opts

  const cave = CaveStore.find(id)

  ensure(upload_id, 'need upload id')
  ensure(cave.uploads, 'need cached uploads')

  const upload = cave.uploads[upload_id]
  ensure(upload, 'need upload in upload cache')

  // Get download URL
  const client = CredentialsStore.get_current_user()

  let url
  try {
    if (cave.key) {
      url = (await client.download_upload_with_key(cave.key.id, upload_id)).url
    } else {
      url = (await client.download_upload(upload_id)).url
    }
  } catch (e) {
    if (e.errors && e.errors[0] === 'invalid upload') {
      await new Promise((resolve, reject) => setTimeout(resolve, 1500))
      throw new Transition({
        to: 'find-upload',
        reason: 'upload-gone'
      })
    }
    throw e
  }

  const parsed = url_parser.parse(url)
  log(opts, `downloading from ${parsed.hostname}`)

  const dest = CaveStore.archive_path(cave.install_location, upload)

  try {
    await butler.dl({ url, dest, onprogress, logger, emitter })
  } catch (err) {
    log(opts, `couldn't finish download: ${err.message || err}`)

    if (cave.launchable) {
      log(opts, `launchable download cancelled, keeping`)
    } else {
      log(opts, `first download cancelled, wiping ${dest}`)
      AppActions.implode_cave(id)
      await butler.wipe(dest)
    }

    throw err
  }

  throw new Transition({ to: 'install', reason: 'download-finished', data: {upload_id} })
}

export default { start }
