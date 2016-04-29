
import {put, call, select} from 'redux-saga/effects'
import pathmaker from '../../util/pathmaker'
import invariant from 'invariant'

import {log, opts} from './log'
import {startTask} from './start-task'
import {startDownload} from './start-download'

import * as actions from '../../actions'

export function * _queueGame (action) {
  const {game} = action.payload
  invariant(typeof game === 'object', 'queueGame has a game object')
  const cave = yield select((state) => state.globalMarket.cavesByGameId[game.id])

  if (cave) {
    log(opts, `Have a cave for game ${game.id}, launching`)
    yield * startCave(game, cave)
    return
  }

  log(opts, `No cave for ${game.id}, attempting install`)
  const uploadResponse = yield call(startTask, {
    name: 'find-upload',
    gameId: game.id,
    game: game
  })

  const {uploads, downloadKey} = uploadResponse.result
  if (uploads.length > 0) {
    if (uploads.length > 1) {
      // TODO: implement this, this task doesn't exist.
      // const upload = (yield call(startTask, {
      //   name: 'pick-upload',
      //   uploads,
      //   downloadKey
      // })).result
      const upload = uploads[0]

      yield call(startDownload, {
        game,
        gameId: game.id,
        upload,
        totalSize: upload.size,
        destPath: pathmaker.downloadPath(upload),
        downloadKey,
        reason: 'install'
      })
    } else {
      const upload = uploads[0]

      yield call(startDownload, {
        game,
        gameId: game.id,
        upload: upload,
        totalSize: upload.size,
        destPath: pathmaker.downloadPath(uploads[0]),
        downloadKey,
        reason: 'install'
      })
    }
  } else {
    yield put(actions.queueHistoryItem({
      label: ['game.install.no_uploads_available.message', {title: game.title}],
      detail: ['game.install.no_uploads_available.detail'],
      options: [
        {
          label: ['game.install.visit_web_page'],
          action: actions.browseGame({gameId: game.id, url: game.url})
        },
        {
          label: ['game.install.try_again'],
          action: action
        }
      ]
    }))
    log(opts, `No uploads for ${game.title}: stub`)
  }
}

function * startCave (game, cave) {
  log(opts, `Starting cave ${cave.id}: stub`)
  const {err} = yield call(startTask, {
    name: 'launch',
    gameId: cave.gameId,
    cave
  })

  if (err) {
    yield put(actions.queueHistoryItem({
      label: ['game.install.could_not_launch', {title: game.title}],
      detail: err.reason || ('' + err),
      options: [
        {
          label: ['game.install.visit_web_page'],
          action: actions.browseGame({gameId: game.id, url: game.url})
        },
        {
          label: ['game.install.try_again'],
          action: actions.queueGame({game})
        }
      ]
    }))
  }
}
