
import Promise from 'bluebird'
import {camelify, camelifyObject} from './format'

import path from 'path'
import sf from './sf'
import mklog from './log'
const log = mklog('market')
const opts = {logger: new mklog.Logger()}

import deepFreeze from 'deep-freeze'
import {isEqual, every} from 'underline'

import {EventEmitter} from 'events'

export default class Market extends EventEmitter {
  constructor () {
    super()
    this.data = {}
    this._atomicInvocations = 0
  }

  async load (dbPath) {
    log(opts, `loading market db from ${dbPath}`)

    this.dbPath = dbPath
    const self = this
    const toSave = {}

    const entities = {}
    const loadRecord = async function (recordPath) {
      const tokens = recordPath.split('/')
      const [tableName, entityId] = tokens
      const file = path.join(self.getDbRoot(), recordPath)
      const contents = await sf.readFile(file)

      const camelTableName = camelify(tableName)
      const table = entities[camelTableName] || {}

      let record
      try {
        record = JSON.parse(contents)
      } catch (e) {
        log(opts, `warning: skipping malformed record ${tableName}/${entityId} (${e})`)
        return
      }

      const camelRecord = camelifyObject(record)
      if (camelTableName !== tableName || !camelRecord::isEqual(record)) {
        toSave[camelTableName] = toSave[camelTableName] || []
        toSave[camelTableName].push(entityId)
      }
      table[entityId] = camelRecord
      entities[camelTableName] = table
    }

    const wipeTemp = async function (recordPath) {
      const file = path.join(self.getDbRoot(), recordPath)
      await sf.wipe(file)
    }

    log(opts, `cleaning temporary files from ${dbPath}`)
    await sf.glob('*/*.tmp*', {cwd: this.getDbRoot()}).map(wipeTemp, {concurrency: 4})

    log(opts, `loading records for ${dbPath}`)
    await sf.glob('*/*', {cwd: this.getDbRoot()}).map(loadRecord, {concurrency: 4})

    log(opts, `migrating old entries for ${dbPath}`)
    await this.saveAllEntities({entities: toSave}, {wait: true})

    log(opts, 'populating in-memory DB with disk records')
    await self.saveAllEntities({entities}, {persist: false, initial: true})

    log(opts, `done loading db from ${dbPath}`)
    this.emit('ready')
  }

  getDbRoot () {
    if (!this.dbPath) {
      throw new Error('tried to get db root before it was set')
    }

    return this.dbPath
  }

  /* Data persistence / retrieval */

  entityPath (tableName, entityId) {
    return path.join(this.getDbRoot(), `${tableName}/${entityId}`)
  }

  async saveToDisk (tableName, entityId, record) {
    const file = this.entityPath(tableName, entityId)
    const tmpPath = file + '.tmp' + (this._atomicInvocations++)
    await sf.writeFile(tmpPath, JSON.stringify(record))

    if (this.data[tableName] && this.data[tableName][entityId]) {
      await sf.rename(tmpPath, file)
    } else {
      // entity has been deleted in the meantime
      await sf.wipe(tmpPath)
    }
  }

  async deleteFromDisk (tableName, entityId) {
    await sf.wipe(this.entityPath(tableName, entityId))
  }

  async saveEntity (tableName, id, record, opts) {
    const response = {
      entities: {
        [tableName]: { [id]: record }
      }
    }
    return await this.saveAllEntities(response, opts)
  }

  async saveAllEntities (response, opts) {
    opts = opts || {}
    const {wait = false, persist = true, initial = false} = opts

    let promises = null
    if (wait) {
      promises = []
    }

    const updated = {}

    for (const tableName of Object.keys(response.entities)) {
      const entities = response.entities[tableName]
      let table = this.data[tableName] || {}
      updated[tableName] = updated[tableName] || []

      for (const entityId of Object.keys(entities)) {
        updated[tableName].push(entityId)
        const entity = entities[entityId]

        const record = table[entityId] || {}
        const same = Object.keys(entity)::every(
          (key) => entity[key]::isEqual(record[key])
        )

        if (!same) {
          const newRecord = deepFreeze(Object.assign({}, record, entity))
          table[entityId] = newRecord

          if (persist) {
            let p = this.saveToDisk(tableName, entityId, newRecord)
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

    this.emit('commit', {updated, initial})
  }

  async deleteAllEntities (response, opts) {
    opts = opts || {}
    const {wait = false} = opts

    let promises = null
    if (wait) {
      promises = []
    }

    for (const tableName of Object.keys(response.entities)) {
      const entities = response.entities[tableName]
      const table = this.data[tableName] || {}

      for (const entityId of entities) {
        delete table[entityId]

        const p = this.deleteFromDisk(tableName, entityId)
        if (promises) {
          promises.push(p)
        }
      }

      this.data[tableName] = table
    }

    if (wait) {
      await Promise.all(promises)
    }

    const deleted = response.entities
    this.emit('commit', {deleted})
  }

  deleteEntity (tableName, entityId, opts) {
    this.deleteAllEntities({
      entities: { [tableName]: [entityId] }
    }, opts)
  }

  getEntities (table) {
    // lazily creates table in 'data' object
    const entities = this.data[table] || {}
    this.data[table] = entities
    return entities
  }

  getEntity (tableName, entityId) {
    return this.getEntities(tableName)[entityId]
  }

  clear () {
    this.data = {}
  }

  close () {
    log(opts, `closing db ${this.dbPath}`)
    this.clear()
    this.emit('close')
    this.dbPath = null
  }
}
