
import db from '../util/db'
import {indexBy} from 'underscore'

import os from '../util/os'
let log = require('../util/log')('tasks/find-upload')

import {Deadend} from './errors'
import InstallStore from '../stores/install-store'
import AppStore from '../stores/app-store'

function filter_uploads (uploads) {
  // filter uploads to find one relevant to our current platform
  let prop = `p_${os.itch_platform()}`
  return uploads.filter((upload) => !!upload[prop])
}

function score_upload (upload) {
  let filename = upload.filename.toLowerCase()
  let score = 0
  if (/\.zip$/.test(filename)) {
    score += 10
  }
  if (/soundtrack/.test(filename)) {
    score -= 100
  }
  return upload.merge({score})
}

function score_uploads (uploads) {
  return uploads.map(score_upload)
}

function sort_uploads (scored_uploads) {
  return scored_uploads.sort((a, b) =>
    (b.score - a.score)
  )
}

function start (opts) {
  let {id} = opts
  let install, uploads
  let client = AppStore.get_current_user()

  return InstallStore.get_install(id).then((res) => {
    install = res
    log(opts, 'got install')

    return install.key ||
      db.find_one({_table: 'download_keys', game_id: install.game_id})
  }).then((key) => {
    log(opts, `found key ${JSON.stringify(key)} for game ${install.game_id}`)

    if (key) {
      return (
        InstallStore.update_install(id, {key})
        .then(() => client.download_key_uploads(key.id))
      )
    } else {
      return client.game_uploads(this.game.id)
    }
  }).then((res) => {
    uploads = res.uploads
    log(opts, `got a list of ${uploads.length} uploads`)
    return InstallStore.update_install(id, {uploads: indexBy(uploads, 'id')})
  }).then(() =>
    uploads
  ).then(filter_uploads).then(score_uploads).then(sort_uploads).then((uploads) => {
    log(opts, `post-filters, ${uploads.length} uploads left`)
    if (uploads.length > 0) {
      return InstallStore.update_install(id, {upload_id: uploads[0].id})
    } else {
      throw new Deadend({
        reason: 'No downloads available'
      })
    }
  })
}

export default { start }
