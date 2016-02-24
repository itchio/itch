
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
    console.log(`[kalamazoo] found ${caves.length} caves in old DB`)

    caves::each((c) => {
      if (c.hasOwnProperty('_id')) {
        c.id = c._id
        delete c._id
      }
    })

    let games = await self.find({_table: 'games'})
    console.log(`[kalamazoo] found ${games.length} games in old DB`)

    let collections = await self.find({_table: 'collections'})
    console.log(`[kalamazoo] found ${collections.length} collections in old DB`)

    let users = await self.find({_table: 'users'})
    console.log(`[kalamazoo] found ${users.length} users in old DB`)

    let market = require('./market')
    market.save_all_entities({
      entities: {
        collections: collections::indexBy('id'),
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
