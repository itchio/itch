
let Promise = require('bluebird')
let Logger = require('./log').Logger
let log = require('./log')('market')
let opts = {logger: new Logger({sinks: {console: true}})}

let path = require('path')
let sf = require('./sf')
let app = require('./app')

const deep_freeze = require('deep-freeze')

import { isEqual } from 'underline'

const legacy_db = require('./legacy-db')

const state = {
  library_dir: null,

  get_db_root: () => {
    if (!state.library_dir) {
      throw new Error('tried to get db root before library dir was set')
    }
    return path.join(state.library_dir, 'marketdb')
  }
}

/* Data persistence / retrieval */

const data = {}

async function load (user_id) {
  log(opts, `loading db for user ${user_id}`)
  state.library_dir = path.join(app.getPath('userData'), 'users', user_id.toString())

  let old_db_filename = path.join(state.library_dir, 'db.jsonl')
  if (await sf.exists(old_db_filename)) {
    let response = await legacy_db.import_old_data(old_db_filename)
    save_all_entities(response)
    await sf.rename(old_db_filename, old_db_filename + '.obsolete')
  } else {
    log(opts, `nothing to import from legacy db`)
  }

  const entities = {}
  const load_record = async function (record_path) {
    const tokens = record_path.split('/')
    const [table_name, entity_id] = tokens
    const file = path.join(state.get_db_root(), record_path)
    const contents = await sf.read_file(file)

    const table = entities[table_name] || {}
    try {
      table[entity_id] = JSON.parse(contents)
    } catch (e) {
      log(opts, `warning: skipping malformed record ${table_name}/${entity_id} (${e})`)
    }
    entities[table_name] = table
  }

  const wipe_temp = async function (record_path) {
    const file = path.join(state.get_db_root(), record_path)
    await sf.wipe(file)
  }

  await sf.glob('*/*.tmp*', {cwd: state.get_db_root()}).map(wipe_temp, {concurrency: 4})
  await sf.glob('*/*', {cwd: state.get_db_root()}).map(load_record, {concurrency: 4})

  log(opts, `done loading db for user ${user_id}`)
  save_all_entities({entities}, {persist: false})
}

function entity_path (table_name, entity_id) {
  return path.join(state.get_db_root(), table_name, entity_id)
}

async function save_to_disk (table_name, entity_id, record) {
  await sf.write_file_atomic(entity_path(table_name, entity_id), JSON.stringify(record))
}

async function delete_from_disk (table_name, entity_id) {
  await sf.wipe(entity_path(table_name, entity_id))
}

function save_all_entities (response, opts) {
  opts = opts || {}
  const {persist = true, ondone} = opts

  let promises = null
  if (ondone) {
    promises = []
  }

  for (const table_name of Object.keys(response.entities)) {
    const entities = response.entities[table_name]
    let table = data[table_name] || {}

    for (const entity_id of Object.keys(entities)) {
      const entity = entities[entity_id]

      const record = table[entity_id] || {}
      const new_record = Object.assign({}, record, entity)
      if (!record::isEqual(new_record)) {
        table[entity_id] = deep_freeze(new_record)

        if (persist) {
          let p = save_to_disk(table_name, entity_id, new_record)
          if (promises) promises.push(p)
        }
      }
    }

    data[table_name] = table
  }

  if (ondone) {
    Promise.all(promises).then(opts.ondone)
  }
}

function delete_all_entities (response, opts) {
  opts = opts || {}
  const {ondone} = opts

  let promises = null
  if (ondone) {
    promises = []
  }

  for (const table_name of Object.keys(response.entities)) {
    const entities = response.entities[table_name]
    let table = data[table_name] || {}

    for (const entity_id of entities) {
      delete table[entity_id]

      let p = delete_from_disk(table_name, entity_id)
      if (promises) promises.push(p)
    }

    data[table_name] = table
  }

  if (ondone) {
    Promise.all(promises).then(opts.ondone)
  }
}

function get_entities (table) {
  // lazily creates table in 'data' object
  let entities = data[table] || {}
  data[table] = entities
  return entities
}

function clear () {
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      delete data[key]
    }
  }
}

function unload () {
  clear()
  state.library_dir = null
}

module.exports = {
  load,
  get_entities,
  save_all_entities,
  delete_all_entities,
  clear,
  unload,
  get_library_dir: () => state.library_dir,
  _state: state
}
