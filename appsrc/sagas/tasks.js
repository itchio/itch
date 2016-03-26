
import uuid from 'node-uuid'
import invariant from 'invariant'
import {EventEmitter} from 'events'

import createQueue from './queue'
import {getUserMarket} from './market'

import {takeEvery} from 'redux-saga'
import {race, call, put, select} from 'redux-saga/effects'

import {QUEUE_GAME} from '../constants/action-types'

import download from '../tasks/download'

import pathmaker from '../util/pathmaker'

import mklog from '../util/log'
const log = mklog('tasks-saga')
import {opts} from '../logger'

import {
  taskStarted, taskProgress, taskEnded,
  downloadStarted, downloadProgress, downloadEnded,
  queueHistoryItem, browseGame
} from '../actions'

export function * startCave (cave) {
  log(opts, `Should start cave ${cave.id}: stub`)
}

export function * startDownload (downloadOpts) {
  invariant(downloadOpts, 'startDownload cannot have null opts')

  const {upload, downloadKey} = downloadOpts
  log(opts, `Should download ${upload.id}, dl key ? ${downloadKey}`)

  const id = uuid.v4()
  yield put(downloadStarted({id, ...downloadOpts}))

  let err
  try {
    const queue = createQueue(`download-${id}`)

    const out = new EventEmitter()
    out.on('progress', (progress) => {
      queue.dispatch(downloadProgress({id, progress}))
    })

    const credentials = yield select((state) => state.session.credentials)
    const extendedOpts = {
      ...opts,
      ...downloadOpts,
      market: getUserMarket(),
      credentials
    }

    log(opts, `Starting download...`)
    yield race({
      task: call(download, out, extendedOpts),
      queue: call(queue.exhaust)
    })
  } catch (e) {
    log(opts, `Download threw`)
    err = e.task || e
  } finally {
    log(opts, `Download ended, err: ${err ? err.stack || JSON.stringify(err) : '<none>'}`)
    yield put(downloadEnded({id, err}))
  }

  log(opts, `Download done!`)
}

export function * startTask (taskOpts) {
  invariant(taskOpts, 'startTask cannot have null opts')
  invariant(typeof taskOpts.name === 'string', 'startTask opts must contain name')
  invariant(typeof taskOpts.gameId === 'number', 'startTask opts must contain gameId')

  const id = uuid.v4()
  yield put(taskStarted({id, ...taskOpts}))

  let err
  let result
  try {
    const queue = createQueue(`task-${taskOpts.name}-${id}`)

    const out = new EventEmitter()
    out.on('progress', (progress) => {
      queue.dispatch(taskProgress({id, progress}))
    })

    const credentials = yield select((state) => state.session.credentials)
    const extendedOpts = {
      ...taskOpts,
      market: getUserMarket(),
      credentials
    }

    log(opts, `About to start ${taskOpts.name} (${id})`)
    const taskRunner = require(`../tasks/${taskOpts.name}`).default

    log(opts, `Starting ${taskOpts.name} (${id})...`)
    const results = yield race({
      task: call(taskRunner, out, extendedOpts),
      queue: call(queue.exhaust)
    })

    log(opts, `Checking results for ${taskOpts.name} (${id})...`)
    result = results.task
    if (result) {
      log(opts, `Task results: ${JSON.stringify(result, null, 2)}`)
    }
  } catch (e) {
    log(opts, `Task threw`)
    err = e.task || e
  } finally {
    log(opts, `Task ended, err: ${err ? err.stack || JSON.stringify(err) : '<none>'}`)
    yield put(taskEnded({id, err, result}))
  }

  return result
}

export function * _queueGame (action) {
  const {game} = action.payload
  const cave = yield select((state) => state.globalMarket.cavesByGameId[game.id])

  if (cave) {
    log(opts, `Have a cave for game ${game.id}, launching`)
    yield* startCave(cave)
    return
  }

  log(opts, `No cave for ${game.id}, attempting install`)
  const uploadResponse = yield call(startTask, {
    name: 'find-upload',
    gameId: game.id,
    game: game
  })

  const {uploads, downloadKey} = uploadResponse
  if (uploads.length > 0) {
    if (uploads.length > 1) {
      const upload = yield put(startTask, {
        name: 'pick-upload',
        uploads,
        downloadKey
      })

      yield call(startDownload, {
        gameId: game.id,
        upload,
        destPath: pathmaker.downloadPath(upload),
        downloadKey,
        reason: 'install'
      })
    } else {
      yield call(startDownload, {
        gameId: game.id,
        upload: uploads[0],
        destPath: pathmaker.downloadPath(uploads[0]),
        downloadKey,
        reason: 'install'
      })
    }
  } else {
    yield put(queueHistoryItem({
      label: ['game.install.no_uploads_available.message', {title: game.title}],
      detail: ['game.install.no_uploads_available.detail'],
      options: [
        {
          label: ['game.install.visit_web_page'],
          action: browseGame({id: game.id, url: game.url})
        },
        {
          label: ['game.install.try_again'],
          action: action
        }
      ]
    }))
    log(opts, 'No uploads for ${game.title}: stub')
  }
}

export default function * tasksSaga () {
  yield [
    takeEvery(QUEUE_GAME, _queueGame)
  ]
}
