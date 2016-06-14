
import invariant from 'invariant'
import {findWhere} from 'underline'

import {getGlobalMarket} from '../market'
import {call, put} from 'redux-saga/effects'

import {startTask} from './start-task'
import {log, opts} from './log'

import {implodeCave} from '../../actions'

export function * _taskEnded (action) {
  const {taskOpts, result, err} = action.payload
  const {name} = taskOpts

  if (err) {
    log(opts, `Error in task ${name}: ${err}`)
    if (name === 'install') {
      log(opts, 'Install failed, attempting to destroy cave')
      const {gameId} = taskOpts
      const cave = getGlobalMarket().getEntities('caves')::findWhere({gameId})
      if (cave && cave.fresh) {
        yield put(implodeCave({caveId: cave.id}))
      }
    }
    return
  }

  if (name === 'install') {
    const {game, gameId, upload} = taskOpts
    const {caveId} = result
    invariant(caveId, 'install gives caveId')

    const cave = getGlobalMarket().getEntities('caves')[caveId]
    invariant(cave, 'install created cave')

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
  } else if (name === 'launch') {
    const {gameId} = taskOpts
    log(opts, `game ${gameId} just exited!`)
  }
}
