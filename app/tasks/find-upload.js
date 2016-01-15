
let db = require('../util/db')
let indexBy = require('underscore').indexBy

let os = require('../util/os')
let log = require('../util/log')('tasks/find-upload')

let AppActions = require('../actions/app-actions')
let CaveStore = require('../stores/cave-store')
let CredentialsStore = require('../stores/credentials-store')
let classification_actions = require('../constants/classification-actions')

let self = {
  filter_uploads: function (action, uploads) {
    if (action === 'open') {
      // don't filter if we're just downloading a bunch of files
      return uploads
    }

    // filter uploads to find one relevant to our current platform
    let prop = `p_${os.itch_platform()}`
    return uploads.filter((upload) => !!upload[prop])
  },

  score_upload: function (upload) {
    let filename = upload.filename.toLowerCase()
    let score = 50

    /* Preferred formats */
    if (/\.(zip|7z)$/i.test(filename)) {
      score += 10
    }

    /* Usually not what you want (usually set of sources on Linux) */
    if (/\.tar\.(gz|bz2|xz)$/i.test(filename)) {
      score -= 10
    }

    /* Unsupported formats */
    if (/\.(rpm|deb|rar)$/i.test(filename)) {
      score -= 50
    }

    /* Definitely not something we can launch */
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

    let game = await db.find_one({_table: 'games', id: cave.game_id})
    let action = classification_actions[game.classification] || 'launch'

    if (key) {
      AppActions.cave_update(id, {key})
      log(opts, 'bought game, using download key')
      uploads = (await client.download_key_uploads(key.id)).uploads
    } else {
      log(opts, 'no download key, seeking available uploads')
      uploads = (await client.game_uploads(cave.game_id)).uploads
    }

    log(opts, `got a list of ${uploads.length} uploads`)
    AppActions.cave_update(id, {uploads: indexBy(uploads, 'id')})

    if (!(Array.isArray(uploads) && uploads.length > 0)) {
      throw new Error('No downloads available')
    }

    uploads = self.filter_uploads(action, uploads)
    uploads = uploads.map(self.score_upload)
    uploads = self.sort_uploads(uploads)

    log(opts, `sorted uploads: ${JSON.stringify(uploads, null, 2)}`)

    if (uploads.length === 0) {
      throw new Error('No downloads available')
    }

    // TODO: decide what happens when there's several uploads
    let upload = uploads[0]

    let matches = /\.(rar|deb|rpm)$/i.exec(upload.filename)
    if (matches) {
      let format = matches[1]
      console.log(`refusing to work with ${format}`)

      if (!cave.launchable) {
        AppActions.cave_implode(id)
      }
      AppActions.show_rar_policy(format, cave.game_id)
      return
    }

    AppActions.cave_update(id, {upload_id: upload.id})
  }
}

module.exports = self
