
import legacyDB from '../util/legacy-db'
import sf from '../util/sf'
import Market from '../util/market'
import pathmaker from '../util/pathmaker'

import path from 'path'
import {omit, indexBy, map} from 'underline'
import {app} from '../electron'

import * as actions from '../actions'

import {opts} from '../logger'
import mklog from '../util/log'
const log = mklog('preboot')

async function importLegacyDBs () {
  const userDataPath = app.getPath('userData')
  log(opts, `Creating ${userDataPath} in case it doesn't exist..`)
  await sf.mkdir(userDataPath)

  // while importing, there's no need to dispatch DB_COMMIT events, they'll
  // be re-opened on login anyway
  const dispatch = (action) => null

  const globalMarket = new Market(dispatch)
  await globalMarket.load(pathmaker.globalDbPath())

  const usersDir = path.join(userDataPath, 'users')
  const dbFiles = await sf.glob('*/db.jsonl', {cwd: usersDir})

  for (const dbFile of dbFiles) {
    const matches = /[0-9]+/.exec(dbFile)
    if (!matches) {
      log(opts, `Could not extract user id from ${dbFile}, skipping`)
      return
    }

    const userId = matches[0]
    log(opts, `Importing db for user ${userId}`)
    const oldDBFilename = path.join(usersDir, dbFile)
    const obsoleteMarker = oldDBFilename + '.obsolete'

    const markerExists = await sf.exists(obsoleteMarker)
    if (!markerExists) {
      const response = await legacyDB.importOldData(oldDBFilename)
      const perUserResponse = {entities: response.entities::omit('caves')}
      const globalResponse = {
        entities: {
          caves: response.entities.caves::map((cave, caveId) => {
            // in a global context, 'appdata' doesn't make sense anymore
            if (cave.installLocation === 'appdata' || !cave.installLocation) {
              return {...cave, installLocation: `appdata/${userId}`}
            } else {
              return cave
            }
          })::indexBy('id')
        }
      }

      const userMarket = new Market(dispatch)
      const userDbPath = pathmaker.userDbPath(userId)
      await userMarket.load(userDbPath)
      await userMarket.saveAllEntities(perUserResponse, {wait: true})

      await globalMarket.saveAllEntities(globalResponse, {wait: true})
      await sf.writeFile(obsoleteMarker, `If everything is working fine, you may delete both ${oldDBFilename} and this file!`)
      userMarket.close()
    }
  }

  // clean up dead caves
  const caves = globalMarket.getEntities('caves')
  const cavesToDelete = []
  for (const caveId of Object.keys(caves)) {
    const cave = caves[caveId]
    if (!cave.gameId || cave.dead) {
      cavesToDelete.push(caveId)
    }
  }
  if (cavesToDelete.length > 0) {
    log(opts, `Pruning ${cavesToDelete.length} dead caves`)
    await globalMarket.deleteAllEntities({entities: {caves: cavesToDelete}}, {wait: true})
  }

  globalMarket.close()
}

export default async function preboot (store) {
  try {
    await importLegacyDBs()
  } catch (e) {
    console.log(`Could not import legacy db: ${e.stack || e.message || e}`)
  }
  store.dispatch(actions.boot())

  // print various machine specs, see docs/
  const diego = require('../util/diego').default
  diego.hire(opts)
}
