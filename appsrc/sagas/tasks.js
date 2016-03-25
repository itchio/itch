
import uuid from 'node-uuid'
import invariant from 'invariant'
import {EventEmitter} from 'events'

import createQueue from './queue'
import {getUserMarket} from './market'

import {takeEvery} from 'redux-saga'
import {race, call, put, select} from 'redux-saga/effects'

import {QUEUE_GAME} from '../constants/action-types'

import mklog from '../util/log'
const log = mklog('tasks-saga')
import {opts} from '../logger'

import {taskStarted, taskProgress, taskEnded} from '../actions'

export function * startCave (cave) {
  log(opts, `Should start cave ${cave.id}: stub`)
}

export function * startTask (taskOpts) {
  invariant(taskOpts, 'startTask cannot have null opts')
  invariant(typeof taskOpts.name === 'string', 'startTask opts must contain name')
  invariant(typeof taskOpts.gameId === 'number', 'startTask opts must contain gameId')

  const id = uuid.v4()
  yield put(taskStarted({id, ...taskOpts}))

  let err
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
    if (results.task) {
      log(opts, `Task results: ${JSON.stringify(results.task, null, 2)}`)
    }
  } catch (e) {
    log(opts, `Caught something`)
    err = e.task || e
  } finally {
    log(opts, `Task ended, err: ${err ? err.stack || JSON.stringify(err) : '<none>'}`)
    yield put(taskEnded({id, err}))
  }
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
  yield call(startTask, {
    name: 'find-upload',
    gameId: game.id,
    game: game
  })
}

export default function * tasksSaga () {
  yield [
    takeEvery(QUEUE_GAME, _queueGame)
  ]
}
