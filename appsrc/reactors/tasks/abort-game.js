
import invariant from 'invariant'

import * as actions from '../../actions'

export async function abortGame (store, action) {
  const {gameId} = action.payload
  invariant(typeof gameId === 'number', 'aborting needs a gameId')

  const {tasks} = store.getState().tasks

  for (const taskId of Object.keys(tasks)) {
    const task = tasks[taskId]
    if (task.gameId === gameId && task.name === 'launch') {
      store.dispatch(actions.abortTask({id: task.id}))
    }
  }
}
