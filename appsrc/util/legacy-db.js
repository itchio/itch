
import Promise from 'bluebird'
import Datastore from 'nedb'

import {each, indexBy} from 'underline'

import mklog from './log'
const log = mklog('legacy-db')
const opts = { logger: new mklog.Logger() }

/*
 * nedb was previously used for as both a persistent layer and
 * our single source of truth at runtime. that turned out to be
 * overkill & slower than expected. See `util/market` for its replacement.
 */

async function import_old_data (filename) {
  const store = new Datastore({filename, autoload: false})
  const loadDatabase = Promise.promisify(store.loadDatabase, {context: store})
  await loadDatabase()

  const find = Promise.promisify(store.find, {context: store})

  const caves = await find({_table: 'caves'})
  const games = await find({_table: 'games'})
  const collections = await find({_table: 'collections'})
  const users = await find({_table: 'users'})
  const download_keys = await find({_table: 'download_keys'})

  caves::each((x) => {
    if (x.hasOwnProperty('_id')) {
      x.id = x._id
      delete x._id
    }
  })

  const strip_underscore_id = (coll) => {
    coll::each((x) => delete x._id)
  }

  strip_underscore_id(games)
  strip_underscore_id(collections)
  strip_underscore_id(users)
  strip_underscore_id(download_keys)

  log(opts, `Imported ${caves.length} caves, ${games.length} games, ${collections.length} collections, ${users.length} and ${download_keys.length} download keys from legacy db`)

  return {
    entities: {
      collections: collections::indexBy('id'),
      download_keys: download_keys::indexBy('id'),
      users: users::indexBy('id'),
      caves: caves::indexBy('id'),
      games: games::indexBy('id')
    }
  }
}

export default {import_old_data}
