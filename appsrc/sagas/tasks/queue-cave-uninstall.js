
import {getGlobalMarket} from '../market'
import invariant from 'invariant'

import {call} from 'redux-saga/effects'

import {startTask} from './start-task'

export function * _queueCaveUninstall (action) {
  const {caveId} = action.payload
  invariant(caveId, 'cave uninstall has valid caveId')
  const cave = getGlobalMarket().getEntity('caves', caveId)
  invariant(cave, 'cave uninstall has valid cave')

  yield call(startTask, {
    name: 'uninstall',
    gameId: cave.gameId,
    cave
  })
}
