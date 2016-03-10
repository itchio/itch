
import Promise from 'bluebird'
import {camelify, camelifyObject} from './format'

import path from 'path'
import sf from './sf'
import {app} from '../electron'
import legacyDB from './legacy-db'
import mklog from './log'
const log = mklog('market')
const opts = {logger: new mklog.Logger()}

import deepFreeze from 'deep-freeze'
import {isEqual, every} from 'underline'

const state = {
  libraryDir: null,

  getDBRoot: () => {
    if (!state.libraryDir) {
      throw new Error('tried to get db root before library dir was set')
    }
    return path.join(state.libraryDir, 'marketdb')
  }
}

/* Data persistence / retrieval */

const data = {}

async function load (userID) {
  log(opts, `loading db for user ${userID}`)
  state.libraryDir = path.join(app.getPath('userData'), 'users', userID.toString())

  let oldDBFilename = path.join(state.libraryDir, 'db.jsonl')
  if (await sf.exists(oldDBFilename)) {
    let response = await legacyDB.importOldData(oldDBFilename)
    await saveAllEntities(response, {wait: true})
    await sf.rename(oldDBFilename, oldDBFilename + '.obsolete')
  } else {
    log(opts, `nothing to import from legacy db`)
  }

  const toSave = {}

  const entities = {}
  const loadRecord = async function (recordPath) {
    const tokens = recordPath.split('/')
    const [tableName, entityID] = tokens
    const file = path.join(state.getDBRoot(), recordPath)
    const contents = await sf.readFile(file)

    const camelTableName = camelify(tableName)
    const table = entities[camelTableName] || {}

    let record
    try {
      record = JSON.parse(contents)
    } catch (e) {
      log(opts, `warning: skipping malformed record ${tableName}/${entityID} (${e})`)
      return
    }

    const camelRecord = camelifyObject(record)
    if (camelTableName !== tableName || !camelRecord::isEqual(record)) {
      toSave[camelTableName] = toSave[camelTableName] || []
      toSave[camelTableName].push(entityID)
    }
    table[entityID] = camelRecord
    entities[camelTableName] = table
  }

  const wipeTemp = async function (recordPath) {
    const file = path.join(state.getDBRoot(), recordPath)
    await sf.wipe(file)
  }

  await sf.glob('*/*.tmp*', {cwd: state.getDBRoot()}).map(wipeTemp, {concurrency: 4})
  await sf.glob('*/*', {cwd: state.getDBRoot()}).map(loadRecord, {concurrency: 4})
  await saveAllEntities({entities: toSave}, {wait: true})

  log(opts, `done loading db for user ${userID}`)
  saveAllEntities({entities}, {persist: false})
}

function entityPath (tableName, entityID) {
  return path.join(state.getDBRoot(), `${tableName}/${entityID}`)
}

let _atomicInvocations = 0

async function saveToDisk (tableName, entityID, record) {
  const file = entityPath(tableName, entityID)
  const tmpPath = file + '.tmp' + (_atomicInvocations++)
  await sf.writeFile(tmpPath, JSON.stringify(record))

  if (data[tableName] && data[tableName][entityID]) {
    await sf.rename(tmpPath, file)
  } else {
    // entity has been deleted in the meantime
    await sf.wipe(tmpPath)
  }
}

async function deleteFromDisk (tableName, entityID) {
  await sf.wipe(entityPath(tableName, entityID))
}

async function saveAllEntities (response, opts) {
  opts = opts || {}
  const {wait = false, persist = true} = opts

  let promises = null
  if (wait) {
    promises = []
  }

  for (const tableName of Object.keys(response.entities)) {
    const entities = response.entities[tableName]
    let table = data[tableName] || {}

    for (const entityID of Object.keys(entities)) {
      const entity = entities[entityID]

      const record = table[entityID] || {}
      const same = Object.keys(entity)::every(
        (key) => entity[key]::isEqual(record[key])
      )

      if (!same) {
        const newRecord = deepFreeze(Object.assign({}, record, entity))
        table[entityID] = newRecord

        if (persist) {
          let p = saveToDisk(tableName, entityID, newRecord)
          if (wait) {
            promises.push(p)
          }
        }
      }
    }

    data[tableName] = table
  }

  if (wait) {
    await Promise.all(promises)
  }
}

function deleteAllEntities (response, opts) {
  opts = opts || {}
  const {ondone} = opts

  let promises = null
  if (ondone) {
    promises = []
  }

  for (const tableName of Object.keys(response.entities)) {
    const entities = response.entities[tableName]
    let table = data[tableName] || {}

    for (const entityID of entities) {
      delete table[entityID]

      let p = deleteFromDisk(tableName, entityID)
      if (promises) promises.push(p)
    }

    data[tableName] = table
  }

  if (ondone) {
    Promise.all(promises).then(opts.ondone)
  }
}

function getEntities (table) {
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
  state.libraryDir = null
}

export default {
  load,
  getEntities,
  saveAllEntities,
  deleteAllEntities,
  clear,
  unload,
  getLibraryDir: () => state.libraryDir,
  _state: state
}
