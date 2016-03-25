
import {handleActions} from 'redux-actions'
import {createStructuredSelector} from 'reselect'

import {indexBy, omit} from 'underline'

const initialState = {
  tasks: {}
}

const reducer = handleActions({
  TASK_STARTED: (state, action) => {
    const {tasks} = state
    const task = action.payload
    const newTasks = {...tasks, [task.id]: task}
    return {...state, tasks: newTasks}
  },

  TASK_PROGRESS: (state, action) => {
    const {tasks} = state
    const record = action.payload
    const {id} = record
    const task = tasks[id]
    const newTasks = {...tasks, [id]: {...task, ...record}}
    return {...state, tasks: newTasks}
  },

  TASK_ENDED: (state, action) => {
    const {id} = action.payload
    const {tasks} = state
    const newTasks = tasks::omit(id)
    return {...state, tasks: newTasks}
  }
}, initialState)

const selector = createStructuredSelector({
  tasksByCaveId: (state) => state.tasks::indexBy('caveId'),
  tasksByGameId: (state) => state.tasks::indexBy('gameId')
})

export default (state, action) => {
  const reducerFields = reducer(state, action)
  const additionalFields = state ? selector(state) : {}
  return {...reducerFields, ...additionalFields}
}
