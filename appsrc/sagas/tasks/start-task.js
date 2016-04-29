
import {EventEmitter} from 'events'

import invariant from 'invariant'
import uuid from 'node-uuid'
import createQueue from '../queue'
import {getUserMarket, getGlobalMarket} from '../market'

import {race, select, call, put} from 'redux-saga/effects'
import {log, opts} from './log'

import * as actions from '../../actions'

import {throttle} from 'underline'
const PROGRESS_THROTTLE = 50

export function * startTask (taskOpts) {
  invariant(taskOpts, 'startTask cannot have null opts')
  invariant(typeof taskOpts.name === 'string', 'startTask opts must contain name')
  invariant(typeof taskOpts.gameId === 'number', 'startTask opts must contain gameId')

  const id = uuid.v4()
  yield put(actions.taskStarted({id, ...taskOpts}))

  let err
  let result
  try {
    const queue = createQueue(`task-${taskOpts.name}-${id}`)

    const out = new EventEmitter()
    out.on('progress', ((progress) => {
      queue.dispatch(actions.taskProgress({id, progress}))
    })::throttle(PROGRESS_THROTTLE))

    const credentials = yield select((state) => state.session.credentials)
    const extendedOpts = {
      ...opts,
      ...taskOpts,
      market: getUserMarket(),
      globalMarket: getGlobalMarket(),
      credentials
    }

    log(opts, `About to start ${taskOpts.name} (${id})`)
    const taskRunner = require(`../../tasks/${taskOpts.name}`).default

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
    log(opts, 'Task threw')
    err = e.task || e
  } finally {
    log(opts, `Task ended, err: ${err ? err.stack || JSON.stringify(err) : '<none>'}`)
    yield put(actions.taskEnded({name: taskOpts.name, id, err, result, taskOpts}))
  }

  return {err, result}
}
