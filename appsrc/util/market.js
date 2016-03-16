
import Promise from 'bluebird'
import {camelify, camelifyObject} from './format'

import {dbCommit} from '../actions'

import path from 'path'
import sf from './sf'
import {app} from '../electron'
import legacyDB from './legacy-db'
import mklog from './log'
const log = mklog('market')
const opts = {logger: new mklog.Logger()}

import deepFreeze from 'deep-freeze'
import {isEqual, every} from 'underline'

export default class Market {
  constructor (dispatch) {
    this.data = {}
    this.libraryDir = null
    this._atomicInvocations = 0
    this.dispatch = dispatch
  }

  async load (userID) {
    this.userID = userID
    log(opts, `loading db for user ${userID}`)
    this.libraryDir = path.join(app.getPath('userData'), 'users', userID.toString())

    const oldDBFilename = path.join(this.libraryDir, 'db.jsonl')
    const obsoleteMarker = oldDBFilename + '.obsolete'
    if (!await sf.exists(obsoleteMarker)) {
      const response = await legacyDB.importOldData(oldDBFilename)
      await this.saveAllEntities(response, {wait: true})
      await sf.writeFile(obsoleteMarker, `If everything is working fine, you may delete both ${oldDBFilename} and this file!`)
    } else {
      log(opts, `nothing to import from legacy db`)
    }

    const toSave = {}

    const entities = {}
    const loadRecord = async function (recordPath) {
      const tokens = recordPath.split('/')
      const [tableName, entityID] = tokens
      const file = path.join(this.getDBRoot(), recordPath)
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
      const file = path.join(this.getDBRoot(), recordPath)
      await sf.wipe(file)
    }

    await sf.glob('*/*.tmp*', {cwd: this.getDBRoot()}).map(wipeTemp, {concurrency: 4})
    await sf.glob('*/*', {cwd: this.getDBRoot()}).map(loadRecord, {concurrency: 4})
    await this.saveAllEntities({entities: toSave}, {wait: true})

    log(opts, `done loading db for user ${userID}`)
    this.saveAllEntities({entities}, {persist: false})
  }

  getDBRoot () {
    if (!this.libraryDir) {
      throw new Error('tried to get db root before library dir was set')
    }

    return path.join(this.libraryDir, 'marketdb')
  }

  /* Data persistence / retrieval */

  entityPath (tableName, entityID) {
    return path.join(this.getDBRoot(), `${tableName}/${entityID}`)
  }

  async saveToDisk (tableName, entityID, record) {
    const file = this.entityPath(tableName, entityID)
    const tmpPath = file + '.tmp' + (this._atomicInvocations++)
    await sf.writeFile(tmpPath, JSON.stringify(record))

    if (this.data[tableName] && this.data[tableName][entityID]) {
      await sf.rename(tmpPath, file)
    } else {
      // entity has been deleted in the meantime
      await sf.wipe(tmpPath)
    }
  }

  async deleteFromDisk (tableName, entityID) {
    await sf.wipe(this.entityPath(tableName, entityID))
  }

  async saveAllEntities (response, opts) {
    opts = opts || {}
    const {wait = false, persist = true} = opts

    let promises = null
    if (wait) {
      promises = []
    }

    const updated = {}

    for (const tableName of Object.keys(response.entities)) {
      const entities = response.entities[tableName]
      let table = this.data[tableName] || {}
      updated[tableName] = updated[tableName] || []

      for (const entityID of Object.keys(entities)) {
        updated[tableName].push(entityID)
        const entity = entities[entityID]

        const record = table[entityID] || {}
        const same = Object.keys(entity)::every(
          (key) => entity[key]::isEqual(record[key])
        )

        if (!same) {
          const newRecord = deepFreeze(Object.assign({}, record, entity))
          table[entityID] = newRecord

          if (persist) {
            let p = this.saveToDisk(tableName, entityID, newRecord)
            if (wait) {
              promises.push(p)
            }
          }
        }
      }

      this.data[tableName] = table
    }

    if (wait) {
      await Promise.all(promises)
    }

    if (this.dispatch) {
      this.dispatch(dbCommit({updated}))
    }
  }

  deleteAllEntities (response, opts) {
    opts = opts || {}
    const {ondone} = opts

    let promises = null
    if (ondone) {
      promises = []
    }

    for (const tableName of Object.keys(response.entities)) {
      const entities = response.entities[tableName]
      const table = this.data[tableName] || {}

      for (const entityID of entities) {
        delete table[entityID]

        const p = this.deleteFromDisk(tableName, entityID)
        if (promises) {
          promises.push(p)
        }
      }

      this.data[tableName] = table
    }

    if (ondone) {
      Promise.all(promises).then(opts.ondone)
    }

    if (this.dispatch) {
      const deleted = response.entities
      this.dispatch(dbCommit({deleted}))
    }
  }

  getEntities (table) {
    // lazily creates table in 'data' object
    const entities = this.data[table] || {}
    this.data[table] = entities
    return entities
  }

  clear () {
    for (const key in this.data) {
      if (this.data.hasOwnProperty(key)) {
        delete this.data[key]
      }
    }
  }

  unload () {
    log(opts, `unloading db for user ${this.userID}`)
    this.clear()
    this.dispatch = null
    this.libraryDir = null
  }
}
