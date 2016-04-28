
import invariant from 'invariant'

import {getGlobalMarket} from '../market'
import {call} from 'redux-saga/effects'

import {startTask} from './start-task'
import {log, opts} from './log'

export function * _taskEnded (action) {
  const {taskOpts, result} = action.payload

  const {name} = taskOpts
  if (name === 'install') {
    const {game, gameId, upload} = taskOpts

    const {err} = yield call(startTask, {
      name: 'configure',
      gameId,
      game,
      cave,
      upload
    })
    if (err) {
      log(opts, `Error in task ${name}: ${err}`)
      return
    }

    const {caveId} = result
    invariant(caveId, 'install gives caveId')

    const cave = getGlobalMarket().getEntities('caves')[caveId]
    invariant(cave, 'install created cave')
  }
}
