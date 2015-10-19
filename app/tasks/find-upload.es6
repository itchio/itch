
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
    return upload.merge({score})
  },

  sort_uploads: function (scored_uploads) {
    return scored_uploads.sort((a, b) =>
      (b.score - a.score)
    )
  },

  start: function (opts) {
    let {id} = opts
    let install, uploads
    let client = CredentialsStore.get_current_user()

    return InstallStore.get_install(id).then((res) => {
      install = res
      log(opts, 'got install')

      return install.key ||
        db.find_one({_table: 'download_keys', game_id: install.game_id})
    }).then((key) => {
      log(opts, `found key ${JSON.stringify(key)} for game ${install.game_id}`)

      if (key) {
        return (
          AppActions.install_update(id, {key})
          .then(() => client.download_key_uploads(key.id))
        )
      } else {
        return client.game_uploads(install.game_id)
      }
    }).then((res) => {
      uploads = res.uploads
      log(opts, `got a list of ${uploads.length} uploads`)
      return AppActions.install_update(id, {uploads: indexBy(uploads, 'id')})
    }).then(() => {
      if (!(Array.isArray(uploads) && uploads.length > 0)) {
        throw new Error('No downloads available')
      }
      return uploads
    }).then(self.filter_uploads).map(self.score_upload).then(self.sort_uploads).then((uploads) => {
      log(opts, `post-filters, ${uploads.length} uploads left`)
      if (uploads.length > 0) {
        return AppActions.install_update(id, {upload_id: uploads[0].id})
      } else {
        throw new Error('No downloads available')
      }
    })
  }
}

export default self
