
import pathmaker from '../../util/pathmaker'
import invariant from 'invariant'

import {log, opts} from './log'
import {startTask} from './start-task'
import {startDownload} from './start-download'

import * as actions from '../../actions'

export async function queueGame (store, action) {
  invariant(typeof store === 'object', 'queueGame needs a store')
  invariant(typeof action === 'object', 'queueGame needs an action')

  const {game} = action.payload
  invariant(typeof game === 'object', 'queueGame has a game object')
  const cave = store.getState().globalMarket.cavesByGameId[game.id]

  if (cave) {
    log(opts, `Have a cave for game ${game.id}, launching`)
    await startCave(store, game, cave)
    return
  }

  log(opts, `No cave for ${game.id}, attempting install`)
  const uploadResponse = await startTask(store, {
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

      await startDownload(store, {
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

      await startDownload(store, {
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
    store.dispatch(actions.queueHistoryItem({
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

async function startCave (store, game, cave) {
  log(opts, `Starting cave ${cave.id}: stub`)
  const {err} = await startTask(store, {
    name: 'launch',
    gameId: cave.gameId,
    cave
  })

  if (err) {
    store.dispatch(actions.queueHistoryItem({
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
