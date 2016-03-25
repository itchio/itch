
import uuid from 'node-uuid'
import {EventEmitter} from 'events'

import createQueue from './queue'

import {takeEvery} from 'redux-saga'
import {race, call, put, select} from 'redux-saga/effects'
import {delay} from './effects'

import {QUEUE_GAME} from '../constants/action-types'

import mklog from '../util/log'
const log = mklog('tasks-saga')
import {opts} from '../logger'

import {taskStarted, taskProgress, taskEnded} from '../actions'

async function findUpload (out) {
  console.log('in findUpload')
  for (var i = 0; i < 10; i++) {
    out.emit('progress', i / 10)
    await delay(200)
    console.log('in findUpload loop..')
  }
  console.log('in findUpload done')
}

export function * startCave (cave) {
  log(opts, `Should start cave ${cave.id}: stub`)
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

  const id = uuid.v4()
  yield put(taskStarted({id, name: 'find-upload', gameId: game.id}))
  console.log('Should queue game: ', game)

  let err
  try {
    const queue = createQueue(`task-${id}`)

    const out = new EventEmitter()
    out.on('progress', (progress) => {
      queue.dispatch(taskProgress({id, progress}))
    })

    yield race({
      task: call(findUpload, out),
      queue: call(queue.exhaust)
    })
  } catch (e) {
    err = e
  } finally {
    log(opts, `Task ended, err: ${err ? err.stack || err : '<none>'}`)
    yield put(taskEnded({id, err}))
  }
}

export default function * tasksSaga () {
  yield [
    takeEvery(QUEUE_GAME, _queueGame)
  ]
}
