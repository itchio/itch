
import invariant from 'invariant'

import * as actions from '../../actions'

import {sortBy} from 'underline'

export async function abortLastGame (store, action) {
  const tasks = store.getState().tasks.tasks::sortBy('startedAt')
  console.log(`sorted task list: ${JSON.stringify(tasks, 0, 2)}`)

  if (tasks.length > 0) {
    const task = tasks[0]
    console.log(`Aborting ${task.id}, started at ${task.startedAt}`)
    store.dispatch(actions.abortTask({id: task.id}))
  }
}

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
