
import {EventEmitter} from 'events'

import invariant from 'invariant'
import uuid from 'node-uuid'
import {getUserMarket, getGlobalMarket} from '../market'

import {log, opts} from './log'

import * as actions from '../../actions'

import {throttle} from 'underline'
const PROGRESS_THROTTLE = 50

let currentTasks = {}

export async function startTask (store, taskOpts) {
  invariant(taskOpts, 'startTask cannot have null opts')
  invariant(typeof taskOpts.name === 'string', 'startTask opts must contain name')
  invariant(typeof taskOpts.gameId === 'number', 'startTask opts must contain gameId')

  const credentials = store.getState().session.credentials
  const market = getUserMarket()

  const id = uuid.v4()
  store.dispatch(actions.taskStarted({id, startedAt: Date.now(), ...taskOpts}))

  let err
  let result
  try {
    const out = new EventEmitter()
    out.on('progress', ((progress) => {
      store.dispatch(actions.taskProgress({id, progress}))
    })::throttle(PROGRESS_THROTTLE))

    const preferences = store.getState().preferences
    const extendedOpts = {
      ...opts,
      ...taskOpts,
      market,
      globalMarket: getGlobalMarket(),
      credentials,
      preferences
    }

    log(opts, `About to start ${taskOpts.name} (${id})`)
    const taskRunner = require(`../../tasks/${taskOpts.name}`).default

    log(opts, `Starting ${taskOpts.name} (${id})...`)
    currentTasks[id] = {
      emitter: out
    }
    result = await taskRunner(out, extendedOpts)

    log(opts, `Checking results for ${taskOpts.name} (${id})...`)
    if (result) {
      log(opts, `Task results: ${JSON.stringify(result, null, 2)}`)
    }
  } catch (e) {
    log(opts, 'Task threw')
    err = e.task || e
  } finally {
    log(opts, `Task ended, err: ${err ? err.stack || JSON.stringify(err) : '<none>'}`)
    store.dispatch(actions.taskEnded({name: taskOpts.name, id, err, result, taskOpts}))
  }

  return {err, result}
}

export async function abortTask (store, action) {
  const {id} = action.payload
  const task = currentTasks[id]
  if (task && task.emitter) {
    task.emitter.emit('cancel')
    delete currentTasks[id]
  }
}
