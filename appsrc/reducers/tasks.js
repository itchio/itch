
import {handleActions} from 'redux-actions'
import {createStructuredSelector} from 'reselect'

import invariant from 'invariant'
import {indexBy, where, sortBy, omit, pluck, filter} from 'underline'

const initialState = {
  tasks: {},
  finishedTasks: [],
  downloads: {},
  downloadsPaused: false
}

const uninstall = (state, action) => {
  const {downloads} = state
  const newDownloads = downloads::filter((x) => x.gameId !== action.gameId)::indexBy('id')
  return {...state, downloads: newDownloads}
}

const updateSingle = (state, action, record) => {
  const {downloads} = state
  const {id} = record
  invariant(id, 'valid download id in progress')
  const download = downloads[id]
  invariant(id, 'valid download being updated')
  const newDownloads = {
    ...downloads,
    [id]: {
      ...download,
      ...record
    }
  }::indexBy('id')
  return {...state, downloads: newDownloads}
}

const reducer = handleActions({
  QUEUE_CAVE_UNINSTALL: uninstall,
  QUEUE_CAVE_REINSTALL: uninstall,

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

  /* ************************************************* */
  /*                    Woo downloads                  */
  /* ************************************************* */

  DOWNLOAD_STARTED: (state, action) => {
    const {downloads} = state
    const download = action.payload
    invariant(download.id, 'valid download id in started')
    const carryOver = downloads::filter((x) => x.gameId !== download.gameId)::indexBy('id')
    const newDownloads = {...carryOver, [download.id]: download}
    return {...state, downloads: newDownloads}
  },

  DOWNLOAD_PROGRESS: (state, action) => {
    const record = action.payload
    return updateSingle(state, action, record)
  },

  DOWNLOAD_ENDED: (state, action) => {
    const {id} = action.payload
    return updateSingle(state, action, {id, finished: true})
  },

  DOWNLOAD_PRIORITIZE: (state, action) => {
    const {id} = action.payload
    const {downloads, downloadsByOrder} = state
    if (downloadsByOrder.length < 2) {
      // either no downloads, or only one. nothing to prioritize!
      return state
    }
    const first = downloads[downloadsByOrder[0]]
    // don't re-number priorities, just go into the negatives
    const priority = first.priority - 1

    return updateSingle(state, action, {id, priority})
  },

  CLEAR_FINISHED_DOWNLOADS: (state, action) => {
    const {downloads} = state
    const newDownloads = downloads::filter((x) => !x.finished)::indexBy('id')
    return {...state, downloads: newDownloads}
  },

  PAUSE_DOWNLOADS: (state, action) => {
    return {...state, downloadsPaused: true}
  },

  RESUME_DOWNLOADS: (state, action) => {
    return {...state, downloadsPaused: false}
  }
}, initialState)

const selector = createStructuredSelector({
  tasksByGameId: (state) => state.tasks::indexBy('gameId'),
  downloadsByOrder: (state) => state.downloads::filter((x) => !x.finished)::sortBy('order')::pluck('id'),
  finishedDownloads: (state) => state.downloads::where({finished: true})::sortBy('order')::pluck('id'),
  downloadsByGameId: (state) => state.downloads::indexBy('gameId')
})

export default (state, action) => {
  const reducerFields = reducer(state, action)
  const additionalFields = selector(reducerFields)
  return {...reducerFields, ...additionalFields}
}
