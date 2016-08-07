
import invariant from 'invariant'
import humanize from 'humanize-plus'

import pathmaker from '../../util/pathmaker'

import {log, opts} from './log'
import {startTask} from './start-task'
import {startDownload} from './start-download'

import {map, where} from 'underline'

import * as actions from '../../actions'

export async function queueGame (store, action) {
  invariant(typeof store === 'object', 'queueGame needs a store')
  invariant(typeof action === 'object', 'queueGame needs an action')

  const {game, extraOpts = {}, pickedUpload} = action.payload
  invariant(typeof game === 'object', 'queueGame has a game object')
  const cave = store.getState().globalMarket.cavesByGameId[game.id]

  if (cave) {
    log(opts, `Have a cave for game ${game.id}, launching`)
    await startCave(store, game, cave, extraOpts)
    return
  }

  log(opts, `No cave for ${game.id}, attempting install`)
  const uploadResponse = await startTask(store, {
    name: 'find-upload',
    gameId: game.id,
    game: game
  })

  let {uploads, downloadKey} = uploadResponse.result
  if (pickedUpload) {
    uploads = uploads::where({id: pickedUpload})
  }

  if (uploads.length > 0) {
    if (uploads.length > 1) {
      const {title} = game
      store.dispatch(actions.openModal({
        title: ['pick_install_upload.title', {title}],
        message: ['pick_install_upload.message', {title}],
        detail: ['pick_install_upload.detail'],
        bigButtons: uploads::map((upload) => {
          return {
            label: `${upload.displayName || upload.filename} (${humanize.fileSize(upload.size)})`,
            action: actions.queueGame({
              ...action.payload,
              pickedUpload: upload.id
            }),
            icon: 'download'
          }
        }),
        buttons: [
          'cancel'
        ]
      }))
      return
    } else {
      const upload = uploads[0]

      await startDownload(store, {
        game,
        gameId: game.id,
        upload: upload,
        handPicked: !!pickedUpload,
        totalSize: upload.size,
        destPath: pathmaker.downloadPath(uploads[0]),
        downloadKey,
        reason: 'install'
      })
    }
  } else {
    log(opts, `No uploads for ${game.title}`)
    store.dispatch(actions.openModal({
      title: ['game.install.no_uploads_available.message', {title: game.title}],
      message: ['game.install.no_uploads_available.message', {title: game.title}],
      detail: ['game.install.no_uploads_available.detail'],
      buttons: [
        {
          label: ['game.install.visit_web_page'],
          action: actions.browseGame({gameId: game.id, url: game.url})
        },
        {
          label: ['game.install.try_again'],
          action: action
        },
        'cancel'
      ]
    }))
  }
}

async function startCave (store, game, cave, extraOpts) {
  log(opts, `Starting cave ${cave.id}`)
  const {err} = await startTask(store, {
    name: 'launch',
    gameId: cave.gameId,
    cave,
    ...extraOpts
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
