

let db = require('../util/db')
let indexBy = require('underscore').indexBy

let os = require('../util/os')
let log = require('../util/log')('tasks/find-upload')

let AppActions = require('../actions/app-actions')
let CaveStore = require('../stores/cave-store')
let CredentialsStore = require('../stores/credentials-store')

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
    let id = opts.id
    let uploads
    let client = CredentialsStore.get_current_user()

    let cave = await CaveStore.find(id)
    let key = cave.key || await db.find_one({_table: 'download_keys', game_id: cave.game_id})

    if (key) {
      AppActions.cave_update(id, {key})
      log(opts, 'bought game, using download key')
      uploads = (await client.download_key_uploads(key.id)).uploads
    } else {
      log(opts, 'no download key, seeking free uploads')
      uploads = (await client.game_uploads(cave.game_id)).uploads
    }

    log(opts, `got a list of ${uploads.length} uploads`)
    AppActions.cave_update(id, {uploads: indexBy(uploads, 'id')})

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

    AppActions.cave_update(id, {upload_id: uploads[0].id})
  }
}

module.exports = self
