
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

import { pairs } from 'underline'

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
  },

  flatten: function (obj) {
    let result = {}
    for (let pair of obj::pairs()) {
      let k = pair[0]
      let v = pair[1]
      if (k === 'global') continue

      if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
        let sub = self.flatten(v)
        for (let pair of sub::pairs()) {
          let sk = pair[0]
          let sv = pair[1]
          result[`${k}.${sk}`] = sv
        }
      } else {
        result[k] = v
      }
    }
    return result
  },

  merge_one: function (query, data) {
    return self.update(query, {$set: self.flatten(data)})
  },

  /* Helpers */

  find_cave: async function (cave_id) {
    return await self.find_one({_table: 'caves', _id: cave_id})
  },

  find_cave_for_game: async function (game_id) {
    return await self.find_one({_table: 'caves', game_id})
  },

  end: true
}

module.exports = self
