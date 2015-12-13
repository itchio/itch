'use strict'

let Promise = require('bluebird')
let Datastore = require('nedb')
let path = require('path')
let underscore = require('underscore')
let pairs = underscore.pairs
let pluck = underscore.pluck
let camelize = require('./format').camelize

let app = require('electron').app

let mkdirp = require('../promised/mkdirp')

let promised_methods = ['insert', 'update', 'find', 'find_one', 'load_database', 'remove']

let Logger = require('./log').Logger
let opts = {
  logger: new Logger()
}
let log = require('./log')('db')

let self = {
  // intentional ; will crash path.join if we have a logic error
  library_dir: -1,

  load: async function (user_id) {
    log(opts, `loading db for user ${user_id}`)

    let library_dir = path.join(app.getPath('userData'), 'users', user_id.toString())
    self.library_dir = library_dir

    log(opts, `making sure library dir ${library_dir} exists`)
    await mkdirp(library_dir)

    let db_opts = {
      // the nedb format is basically append-only http://jsonlines.org/
      // with automatic compaction now and then
      filename: path.join(library_dir, 'db.jsonl')
    }
    let store = new Datastore(db_opts)
    self.store = store

    // promisify a few nedb methods
    promised_methods.forEach((method) => {
      let node_version = store[camelize(method)]
      self[method] = Promise.promisify(node_version, {context: store})
    })

    await self.load_database()
  },

  unload: function () {
    promised_methods.forEach((method) => {
      delete self[method]
    })
    delete self.store
    self.library_dir = -1
  },

  // returns true if field name looks like a date field
  is_date: function (name) {
    return /_at$/.test(name)
  },

  // parse date returned by itch.io API, make a Javascript Date object out of it
  // assumes UTC, throws on parsing error
  to_date: function (text) {
    let matches = text.match(/^(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)(\.\d*)?$/)
    if (!matches) {
      throw new Error(`Invalid date: ${text}`)
    }
    let year = matches[1]
    let month = matches[2]
    let day = matches[3]
    let hour = matches[4]
    let min = matches[5]
    let sec = matches[6]
    return new Date(Date.UTC(year, month - 1, day, hour, min, sec))
  },

  singularize: function (name) {
    return name.replace(/s$/, '')
  },

  dbify: function (k, v) {
    if (self.is_date(k)) {
      return self.to_date(v)
    } else {
      return v
    }
  },

  flatten: function (obj) {
    let result = {}
    for (let pair of pairs(obj)) {
      let k = pair[0]
      let v = pair[1]
      if (typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
        let sub = self.flatten(v)
        for (let pair of pairs(sub)) {
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

  // Save a bunch of records returned from the itch.io api
  // Ignore objects, except if they're specified in relations
  // with a handler. Parses dates. Requires a unique (table, id),
  // upserts by default
  save_records: function (inputs, opts) {
    if (~~inputs.length === 0) return Promise.resolve()
    let _table = opts.table
    let relations = opts.relations || {}

    let relation_records = {}
    for (let name of Object.keys(relations)) {
      relation_records[name] = []
    }

    let promises = []
    for (let input of inputs) {
      let record = {_table}

      for (let pair of pairs(input)) {
        let k = pair[0]
        let v = pair[1]
        if (typeof v === 'object') {
          let relation = relations[k]
          if (relation) {
            switch (relation[0]) {
              case 'has_one':
                record[k + '_id'] = v.id
                relation_records[k].push(v)
                break
              case 'belongs_to':
                relation_records[k].push(v)
                v[self.singularize(_table) + '_id'] = input.id
                break
              case 'has_many':
                record[self.singularize(k) + '_ids'] = pluck(v, 'id')
                relation_records[k] = relation_records[k].concat(v)
                break
            }
          }
        } else {
          record[k] = self.dbify(k, v)
        }
      }

      promises.push(self.update(
        { _table, id: input.id },
        record,
        {upsert: true}
      ))
    }

    for (let pair of pairs(relation_records)) {
      let name = pair[0]
      let records = pair[1]
      if (~~records.length === 0) continue
      let handler = relations[name][1]
      promises.push(handler(records))
    }

    return Promise.all(promises)
  },

  save_download_keys: function (keys) {
    return self.save_records(keys, {
      table: 'download_keys',
      relations: {
        game: ['has_one', self.save_games]
      }
    })
  },

  save_users: function (users) {
    return self.save_records(users, {
      table: 'users'
    })
  },

  save_games: function (games) {
    return self.save_records(games, {
      table: 'games',
      relations: {
        key: ['belongs_to', self.save_download_keys],
        user: ['has_one', self.save_users]
      }
    })
  },

  save_collections: function (collections) {
    return self.save_records(collections, {
      table: 'collections',
      // NB: we ignore the initial 15 games returned by `my-collections`
      // because we have paginated fetch logic elsewhere
      relations: {}
    })
  }
}

module.exports = self
