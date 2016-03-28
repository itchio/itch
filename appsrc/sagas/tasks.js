
import uuid from 'node-uuid'
import invariant from 'invariant'
import {EventEmitter} from 'events'

import createQueue from './queue'
import {getGlobalMarket, getUserMarket} from './market'

import {takeEvery} from 'redux-saga'
import {race, call, put, select} from 'redux-saga/effects'

import fetch from '../util/fetch'

import {
  QUEUE_GAME,
  QUEUE_CAVE_REINSTALL,
  QUEUE_CAVE_UNINSTALL,
  DOWNLOAD_ENDED,
  TASK_ENDED
} from '../constants/action-types'

import download from '../tasks/download'

import pathmaker from '../util/pathmaker'

import mklog from '../util/log'
const log = mklog('tasks-saga')
import {opts} from '../logger'

import {
  taskStarted, taskProgress, taskEnded,
  downloadStarted, downloadProgress, downloadEnded,
  queueHistoryItem, browseGame, queueGame
} from '../actions'

export function * startCave (game, cave) {
  log(opts, `Starting cave ${cave.id}: stub`)
  const {err} = yield call(startTask, {
    name: 'launch',
    gameId: cave.gameId,
    cave
  })

  if (err) {
    yield put(queueHistoryItem({
      label: ['game.install.could_not_launch', {title: game.title}],
      detail: err.reason || ('' + err),
      options: [
        {
          label: ['game.install.visit_web_page'],
          action: browseGame({gameId: game.id, url: game.url})
        },
        {
          label: ['game.install.try_again'],
          action: queueGame({game})
        }
      ]
    }))
  }
}

export function * startDownload (downloadOpts) {
  invariant(downloadOpts, 'startDownload cannot have null opts')
  invariant(downloadOpts.reason, 'startDownload must have a reason')
  invariant(downloadOpts.game, 'startDownload must have a game')

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
    yield put(downloadEnded({id, err, downloadOpts}))
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
      ...opts,
      ...taskOpts,
      market: getUserMarket(),
      globalMarket: getGlobalMarket(),
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
    yield put(taskEnded({name: taskOpts.name, id, err, result, taskOpts}))
  }

  return {err, result}
}

export function * _queueGame (action) {
  const {game} = action.payload
  const cave = yield select((state) => state.globalMarket.cavesByGameId[game.id])

  if (cave) {
    log(opts, `Have a cave for game ${game.id}, launching`)
    yield* startCave(game, cave)
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
      const upload = (yield put(startTask, {
        name: 'pick-upload',
        uploads,
        downloadKey
      })).result

      yield call(startDownload, {
        game,
        gameId: game.id,
        upload,
        destPath: pathmaker.downloadPath(upload),
        downloadKey,
        reason: 'install'
      })
    } else {
      yield call(startDownload, {
        game,
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
    log(opts, `No uploads for ${game.title}: stub`)
  }
}

export function * _queueCaveUninstall (action) {
  const {caveId} = action.payload
  invariant(caveId, 'cave uninstall has valid caveId')
  const cave = getGlobalMarket().getEntity('caves', caveId)
  invariant(cave, 'cave uninstall has valid cave')

  yield put(startTask({
    name: 'uninstall',
    gameId: cave.gameId,
    cave
  }))
}

export function * _queueCaveReinstall (action) {
  const {caveId} = action.payload
  invariant(caveId, 'cave uninstall has valid caveId')
  const cave = getGlobalMarket().getEntity('caves', caveId)
  invariant(cave, 'cave uninstall has valid cave')

  const credentials = yield select((state) => state.session.credentials)
  const game = fetch.gameLazily(getUserMarket(), credentials, game.id)
  invariant(cave, 'cave uninstall has valid cave')

  yield put(startTask({
    name: 'install',
    reinstall: true,
    gameId: game.id,
    game,
    cave
  }))
}

function * _taskEnded (action) {
  const {taskOpts, result} = action.payload

  const {name} = taskOpts
  if (name === 'install') {
    const {game, gameId, upload} = taskOpts
    const {caveId} = result
    invariant(caveId, 'install gives caveId')

    const cave = getGlobalMarket().getEntities('caves')[caveId]
    invariant(cave, 'install created cave')

    const {err} = (yield call(startTask, {
      name: 'configure',
      gameId,
      game,
      cave,
      upload
    }))
    if (err) {
      log(opts, `Error in configure: ${err}`)
      return
    }
  }
}

function * _downloadEnded (action) {
  const {downloadOpts} = action.payload
  let {err} = action.payload

  const {reason} = downloadOpts
  if (reason === 'install') {
    if (err) {
      log(opts, 'Download had an error, should notify user')
    } else {
      log(opts, 'Download finished, installing..')
      let {err} = yield call(startTask, {
        name: 'install',
        gameId: downloadOpts.gameId,
        game: downloadOpts.game,
        upload: downloadOpts.upload,
        archivePath: downloadOpts.destPath
      })

      if (err) {
        log(opts, `Error in configure: ${err}`)
        return
      }
    }
  } else {
    log(opts, `Downloaded something for reason ${reason}`)
  }
}

export default function * tasksSaga () {
  yield [
    takeEvery(QUEUE_GAME, _queueGame),
    takeEvery(QUEUE_CAVE_REINSTALL, _queueCaveReinstall),
    takeEvery(QUEUE_CAVE_UNINSTALL, _queueCaveUninstall),
    takeEvery(DOWNLOAD_ENDED, _downloadEnded),
    takeEvery(TASK_ENDED, _taskEnded)
  ]
}
