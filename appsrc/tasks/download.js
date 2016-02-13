
let errors = require('./errors')

let log = require('../util/log')('tasks/download')
let butler = require('../util/butler')
let noop = require('../util/noop')

let CaveStore = require('../stores/cave-store')
let CredentialsStore = require('../stores/credentials-store')
let AppActions = require('../actions/app-actions')

function ensure (predicate, reason) {
  if (!predicate) {
    throw new errors.Transition({
      to: 'find-upload',
      reason
    })
  }
}

async function start (opts) {
  let id = opts.id
  let onprogress = opts.onprogress || noop
  let logger = opts.logger
  let emitter = opts.emitter
  let upload_id = opts.upload_id

  let cave = await CaveStore.find(id)

  ensure(upload_id, 'need upload id')
  ensure(cave.uploads, 'need cached uploads')

  let upload = cave.uploads[upload_id]
  ensure(upload, 'need upload in upload cache')

  // Get download URL
  let client = CredentialsStore.get_current_user()
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
      throw new errors.Transition({
        to: 'find-upload',
        reason: 'upload-gone'
      })
    }
    throw e
  }

  let parsed = require('url').parse(url)
  log(opts, `downloading from ${parsed.hostname}`)

  let dest = CaveStore.archive_path(cave.install_location, upload)

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

  throw new errors.Transition({ to: 'install', reason: 'download-finished', data: {upload_id} })
}

module.exports = { start }
