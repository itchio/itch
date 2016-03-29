
import invariant from 'invariant'
import {findWhere} from 'underline'

import {getGlobalMarket, getUserMarket} from '../market'
import {select, call} from 'redux-saga/effects'

import {startTask} from './start-task'

import pathmaker from '../../util/pathmaker'
import fetch from '../../util/fetch'

import {startDownload} from './start-download'

export function * _queueCaveReinstall (action) {
  const {caveId} = action.payload
  invariant(caveId, 'cave reinstall has valid caveId')
  const cave = getGlobalMarket().getEntity('caves', caveId)
  invariant(cave, 'cave reinstall has valid cave')

  const credentials = yield select((state) => state.session.credentials)
  const game = yield call(fetch.gameLazily, getUserMarket(), credentials, cave.gameId)
  invariant(game, 'cave reinstall has valid game')

  invariant(cave.uploadId, 'cave reinstall has uploadId')
  invariant(cave.uploads, 'cave reinstall has uploads')
  const upload = cave.uploads::findWhere({id: cave.uploadId})
  invariant(upload, 'cave reinstall contained')

  const archivePath = pathmaker.downloadPath(upload)

  const {downloadKey} = cave

  yield call(startDownload, {
    game,
    gameId: game.id,
    upload,
    destPath: archivePath,
    downloadKey,
    reason: 'reinstall'
  })

  yield call(startTask, {
    name: 'install',
    reinstall: true,
    upload,
    gameId: game.id,
    game,
    cave,
    archivePath
  })
}
