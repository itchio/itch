
let Promise = require('bluebird')
let Datastore = require('nedb')
let path = require('path')

let camelize = require('./format').camelize

let app = require('electron').app

let sf = require('../util/sf')

let Logger = require('./log').Logger
let opts = {
  logger: new Logger()
}
let log = require('./log')('db')

import { each, indexBy } from 'underline'

let self = {
  promised_methods: ['insert', 'update', 'find', 'find_one', 'load_database', 'remove', 'count'],

  // intentional ; will crash path.join if we have a logic error
  library_dir: -1,

  load: async function (user_id) {
    log(opts, `loading db for user ${user_id}`)

    let library_dir = path.join(app.getPath('userData'), 'users', user_id.toString())
    self.library_dir = library_dir

    log(opts, `making sure library dir ${library_dir} exists`)
    await sf.mkdir(library_dir)

    let db_opts = {
      // the nedb format is basically append-only http://jsonlines.org/
      // with automatic compaction now and then
      filename: path.join(library_dir, 'db.jsonl')
    }
    let store = new Datastore(db_opts)
    self.store = store

    // promisify a few nedb methods
    self.promised_methods.forEach((method) => {
      let node_version = store[camelize(method)]
      self[method] = Promise.promisify(node_version, {context: store})
    })

    await self.load_database()

    let caves = await self.find({_table: 'caves'})
    console.log(`[cunégonde] found ${caves.length} caves in old DB`)

    caves::each((x) => {
      if (x.hasOwnProperty('_id')) {
        x.id = x._id
      }
    })

    let games = await self.find({_table: 'games'})
    console.log(`[cunégonde] found ${games.length} games in old DB`)

    let collections = await self.find({_table: 'collections'})
    console.log(`[cunégonde] found ${collections.length} collections in old DB`)

    let users = await self.find({_table: 'users'})
    console.log(`[cunégonde] found ${users.length} users in old DB`)

    let download_keys = await self.find({_table: 'download_keys'})
    console.log(`[cunégonde] found ${download_keys.length} download keys in old DB`)

    let strip_underscore_id = (coll) => {
      coll::each((x) => delete x._id)
    }

    strip_underscore_id(games)
    strip_underscore_id(collections)
    strip_underscore_id(users)
    strip_underscore_id(download_keys)

    let market = require('./market')
    market.save_all_entities({
      entities: {
        collections: collections::indexBy('id'),
        download_keys: download_keys::indexBy('id'),
        users: users::indexBy('id'),
        caves: caves::indexBy('id'),
        games: games::indexBy('id')
      }
    })
  },

  unload: function () {
    self.promised_methods.forEach((method) => {
      delete self[method]
    })
    delete self.store
    self.library_dir = -1
  },

  end: true
}

module.exports = self
