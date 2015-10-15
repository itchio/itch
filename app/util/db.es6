
import Promise from 'bluebird'
import Datastore from 'nedb'
import path from 'path'
import {pairs, pluck} from 'underscore'
import {camelize} from './format'

import app from 'app'

import mkdirp from '../promised/mkdirp'

let library_dir = path.join(app.getPath('home'), 'Downloads', 'itch.io')

let self = {
  store: new Datastore({
    filename: path.join(library_dir, 'db.dat')
  }),

  load: function () {
    return mkdirp(library_dir).then(_ => self.load_database())
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
    let [, year, month, day, hour, min, sec] = matches
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

  // Save a bunch of records returned from the itch.io api
  // Ignore objects, except if they're specified in relations
  // with a handler. Parses dates. Requires a unique (table, id),
  // upserts by default
  save_records: function (inputs, opts) {
    if (inputs.length === 0) return Promise.resolve()
    let _table = opts.table
    let relations = opts.relations || {}

    let relation_records = {}
    for (let name of Object.keys(relations)) {
      relation_records[name] = []
    }

    let promises = []
    for (let input of inputs) {
      let record = {_table}

      for (let [k, v] of pairs(input)) {
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

    for (let [name, records] of pairs(relation_records)) {
      if (records.length === 0) continue
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
      relations: {
        games: ['has_many', self.save_games]
      }
    })
  }
}

// promisify a few nedb methods
let store = self.store

;['insert', 'update', 'find', 'find_one', 'load_database'].forEach((method) => {
  let node_version = store[camelize(method)]
  self[method] = Promise.promisify(node_version, store)
})

export default self
