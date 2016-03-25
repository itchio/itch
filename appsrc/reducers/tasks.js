
import {handleActions} from 'redux-actions'
import {createStructuredSelector} from 'reselect'

import invariant from 'invariant'
import {indexBy, omit} from 'underline'

const initialState = {
  tasks: {},
  finishedTasks: []
}

const reducer = handleActions({
  TASK_STARTED: (state, action) => {
    const {tasks} = state
    const task = action.payload
    invariant(task.id, 'valid task id in started')
    const newTasks = {...tasks, [task.id]: task}
    return {...state, tasks: newTasks}
  },

  TASK_PROGRESS: (state, action) => {
    const {tasks} = state
    const record = action.payload
    const {id} = record
    invariant(id, 'valid task id in progress')
    const task = tasks[id]
    const newTasks = {...tasks, [id]: {...task, ...record}}
    return {...state, tasks: newTasks}
  },

  TASK_ENDED: (state, action) => {
    const {id} = action.payload
    invariant(id, 'valid task id in ended')
    const {tasks, finishedTasks} = state
    const newTasks = tasks::omit(id)
    const newFinishedTasks = [tasks[id], ...finishedTasks]
    return {...state, tasks: newTasks, finishedTasks: newFinishedTasks}
  }
}, initialState)

const selector = createStructuredSelector({
  tasksByCaveId: (state) => state.tasks::indexBy('caveId'),
  tasksByGameId: (state) => state.tasks::indexBy('gameId')
})

export default (state, action) => {
  const reducerFields = reducer(state, action)
  const additionalFields = selector(reducerFields)
  return {...reducerFields, ...additionalFields}
}
