
import {handleActions} from 'redux-actions'
import {createStructuredSelector} from 'reselect'

import invariant from 'invariant'
import {indexBy, sortBy, omit} from 'underline'

const initialState = {
  tasks: {},
  finishedTasks: [],
  downloads: {},
  finishedDownloads: []
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
  },

  DOWNLOAD_STARTED: (state, action) => {
    const {downloads} = state
    const download = action.payload
    invariant(download.id, 'valid download id in started')
    const newDownloads = {...downloads, [download.id]: download}
    return {...state, downloads: newDownloads}
  },

  DOWNLOAD_PROGRESS: (state, action) => {
    const {downloads} = state
    const record = action.payload
    const {id} = record
    invariant(id, 'valid download id in progress')
    const download = downloads[id]
    const newDownloads = {...downloads, [id]: {...download, ...record}}
    return {...state, downloads: newDownloads}
  },

  DOWNLOAD_ENDED: (state, action) => {
    const {id} = action.payload
    invariant(id, 'valid download id in ended')
    const {downloads, finishedDownloads} = state
    const newDownloads = downloads::omit(id)
    const newFinishedDownloads = [downloads[id], ...finishedDownloads]
    return {...state, downloads: newDownloads, finishedDownloads: newFinishedDownloads}
  },

  DOWNLOAD_PRIORITIZE: (state, action) => {
    const {id} = action.payload
    const {downloadsByPriority} = state
    const first = downloadsByPriority[0]

    if (!first) {
      return state
    }


    return state
  }
}, initialState)

const selector = createStructuredSelector({
  tasksByGameId: (state) => state.tasks::indexBy('gameId'),
  downloadsByPriority: (state) => state.downloads::sortBy('priority')::pluck('id'),
  downloadsByGameId: (state) => state.downloads::indexBy('gameId'),
  downloadsByDate: (state) => state.downloads::sortBy('date')
})

export default (state, action) => {
  const reducerFields = reducer(state, action)
  const additionalFields = selector(reducerFields)
  return {...reducerFields, ...additionalFields}
}
