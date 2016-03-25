
import uuid from 'node-uuid'

import {takeEvery} from 'redux-saga'
import {call, put, select} from 'redux-saga/effects'

import {QUEUE_GAME} from '../constants/action-types'

import mklog from '../util/log'
const log = mklog('tasks-saga')
import {opts} from '../logger'

import {taskStarted, taskProgress, taskEnded} from '../actions'

async function findUpload () {
  await new Promise((resolve, reject) => setTimeout(resolve, 2000))
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
    const opts = {}
    yield put(taskProgress({id, progress: 0.5}))
    yield call(findUpload, opts)
  } catch (e) {
    err = e
  } finally {
    yield put(taskEnded({id, err}))
  }
}

export default function * tasksSaga () {
  yield [
    takeEvery(QUEUE_GAME, _queueGame)
  ]
}
