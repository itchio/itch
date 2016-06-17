
import invariant from 'invariant'
import {findWhere} from 'underline'

import {getGlobalMarket} from '../market'

import {startTask} from './start-task'
import {log, opts} from './log'

import * as actions from '../../actions'

export async function taskEnded (store, action) {
  const {taskOpts, result, err} = action.payload
  const {name} = taskOpts

  if (err) {
    log(opts, `Error in task ${name}: ${err}`)
    if (name === 'install') {
      log(opts, 'Install failed, attempting to destroy cave')
      const {gameId} = taskOpts
      const cave = getGlobalMarket().getEntities('caves')::findWhere({gameId})
      if (cave && cave.fresh) {
        store.dispatch(actions.implodeCave({caveId: cave.id}))
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

    const {err} = await startTask(store, {
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
    const state = store.getState()
    const tab = state.session.navigation.tabData[state.session.navigation.id]
    log(opts, `game ${gameId} just exited! current tab = ${JSON.stringify(tab, 0, 2)}`)

    if (tab && tab.path === `games/${gameId}`) {
      log(opts, 'encouraging generosity!')
      store.dispatch(actions.encourageGenerosity({gameId: gameId, level: 'discreet'}))
    }
  }
}
