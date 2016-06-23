
import invariant from 'invariant'
import {findWhere} from 'underline'

import {getGlobalMarket, getUserMarket} from '../market'

import {startTask} from './start-task'

import pathmaker from '../../util/pathmaker'
import fetch from '../../util/fetch'

import {startDownload} from './start-download'

export async function queueCaveReinstall (store, action) {
  const {caveId} = action.payload
  invariant(caveId, 'cave reinstall has valid caveId')
  const cave = getGlobalMarket().getEntity('caves', caveId)
  invariant(cave, 'cave reinstall has valid cave')

  const credentials = store.getState().session.credentials
  const game = await fetch.gameLazily(getUserMarket(), credentials, cave.gameId)
  invariant(game, 'cave reinstall has valid game')

  invariant(cave.uploadId, 'cave reinstall has uploadId')
  invariant(cave.uploads, 'cave reinstall has uploads')
  const uploadResponse = await startTask(store, {
    name: 'find-upload',
    gameId: game.id,
    game: game
  })
  const upload = uploadResponse.result.uploads[0]
  invariant(upload, 'found upload for cave reinstall')

  const archivePath = pathmaker.downloadPath(upload)

  const findDownloadKey = () => {
    return getUserMarket().getEntities('downloadKeys')::findWhere({gameId: game.id})
  }

  await startDownload(store, {
    game,
    gameId: game.id,
    upload,
    totalSize: upload.size,
    destPath: archivePath,
    downloadKey: cave.downloadKey || findDownloadKey(),
    reason: 'reinstall'
  })

  await startTask(store, {
    name: 'install',
    reinstall: true,
    upload,
    gameId: game.id,
    game,
    cave,
    archivePath
  })
}
