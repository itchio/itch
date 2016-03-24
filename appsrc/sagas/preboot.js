
import {opts} from '../logger'
import mklog from '../util/log'
const log = mklog('preboot')

import {takeEvery} from 'redux-saga'
import {call, put} from 'redux-saga/effects'

import legacyDB from '../util/legacy-db'
import sf from '../util/sf'
import Market from '../util/market'
import pathmaker from '../util/pathmaker'

import path from 'path'
import {omit, indexBy, map} from 'underline'
import {app} from '../electron'

import {boot} from '../actions'
import {PREBOOT} from '../constants/action-types'

export function * importLegacyDBs () {
  // while importing, there's no need to dispatch DB_COMMIT events, they'll
  // be re-opened on login anyway
  const dispatch = (action) => null

  const globalMarket = new Market(dispatch)
  yield call([globalMarket, globalMarket.load], pathmaker.globalDbPath())

  const usersDir = path.join(app.getPath('userData'), 'users')
  const dbFiles = yield call(sf.glob, '*/db.jsonl', {cwd: usersDir})
  log(opts, `Found db files: ${JSON.stringify(dbFiles, null, 2)}`)

  for (const dbFile of dbFiles) {
    const userId = dbFile.split(path.sep)[0]
    log(opts, `Stumbled upon legacy db for user ${userId}`)
    const oldDBFilename = path.join(usersDir, dbFile)
    const obsoleteMarker = oldDBFilename + '.obsolete'

    const markerExists = yield call(sf.exists, obsoleteMarker)
    if (markerExists) {
      log(opts, `nothing to import from legacy db ${dbFile}`)
    } else {
      const response = yield call(legacyDB.importOldData, oldDBFilename)
      const perUserResponse = {entities: response.entities::omit('caves')}
      const globalResponse = {
        entities: {
          caves: response.entities.caves::map((cave, caveId) => {
            // in a global context, `appdata` doesn't make sense anymore
            if (cave.installLocation === 'appdata') {
              return {...cave, installLocation: `appdata/${userId}`}
            } else {
              return cave
            }
          })::indexBy('id')
        }
      }

      const userMarket = new Market(dispatch)
      const userDbPath = pathmaker.userDbPath(userId)
      yield call([userMarket, userMarket.load], userDbPath)
      yield call([userMarket, userMarket.saveAllEntities], perUserResponse, {wait: true})

      yield call([globalMarket, globalMarket.saveAllEntities], globalResponse, {wait: true})
      yield call(sf.writeFile, obsoleteMarker, `If everything is working fine, you may delete both ${oldDBFilename} and this file!`)
      yield call([userMarket, userMarket.close])
    }
  }

  yield call([globalMarket, globalMarket.close])
  log(opts, 'All legacy DBs imported!')
}

export function * _preboot () {
  yield call(importLegacyDBs)
  yield put(boot())
}

export default function * prebootSaga () {
  yield [
    takeEvery(PREBOOT, _preboot)
  ]
}
