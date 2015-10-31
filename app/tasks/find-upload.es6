
import db from '../util/db'
import {indexBy} from 'underscore'

import os from '../util/os'
let log = require('../util/log')('tasks/find-upload')

import AppActions from '../actions/app-actions'
import InstallStore from '../stores/install-store'
import CredentialsStore from '../stores/credentials-store'

let self = {
  filter_uploads: function (uploads) {
    // filter uploads to find one relevant to our current platform
    let prop = `p_${os.itch_platform()}`
    return uploads.filter((upload) => !!upload[prop])
  },

  score_upload: function (upload) {
    let filename = upload.filename.toLowerCase()
    let score = 0
    if (/\.zip$/.test(filename)) {
      score += 10
    }
    if (/soundtrack/.test(filename)) {
      score -= 100
    }
    return Object.assign({}, upload, {score})
  },

  sort_uploads: function (scored_uploads) {
    return scored_uploads.sort((a, b) =>
      (b.score - a.score)
    )
  },

  start: async function (opts) {
    let {id} = opts
    let uploads
    let client = CredentialsStore.get_current_user()

    let install = await InstallStore.get_install(id)
    let key = install.key || await db.find_one({_table: 'download_keys', game_id: install.game_id})
    log(opts, `found key ${JSON.stringify(key)} for game ${install.game_id}`)

    if (key) {
      AppActions.install_update(id, {key})
      console.log('getting uploads with key')
      uploads = (await client.download_key_uploads(key.id)).uploads
    } else {
      console.log('getting uploads without key')
      console.log('client = ' + JSON.stringify(client))
      uploads = (await client.game_uploads(install.game_id)).uploads
    }

    log(opts, `got a list of ${uploads.length} uploads`)
    AppActions.install_update(id, {uploads: indexBy(uploads, 'id')})

    if (!(Array.isArray(uploads) && uploads.length > 0)) {
      throw new Error('No downloads available')
    }

    uploads = self.filter_uploads(uploads)
    uploads = uploads.map(self.score_upload)
    uploads = self.sort_uploads(uploads)

    log(opts, `post-filters, ${uploads.length} uploads left`)
    if (uploads.length === 0) {
      throw new Error('No downloads available')
    }

    AppActions.install_update(id, {upload_id: uploads[0].id})
  }
}

export default self
