
import {getGlobalMarket} from '../market'
import invariant from 'invariant'

import {startTask} from './start-task'

export async function queueCaveUninstall (store, action) {
  const {caveId} = action.payload
  invariant(caveId, 'cave uninstall has valid caveId')
  const cave = getGlobalMarket().getEntity('caves', caveId)
  invariant(cave, 'cave uninstall has valid cave')

  await startTask(store, {
    name: 'uninstall',
    gameId: cave.gameId,
    cave
  })
}
