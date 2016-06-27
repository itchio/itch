
import {handleActions} from 'redux-actions'
import {createStructuredSelector} from 'reselect'

import invariant from 'invariant'
import {indexBy, where, sortBy, pluck, filter, map} from 'underline'

const initialState = {
  // downloads: {},
  downloads: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]::map((x, i) => {
    return {
      id: i,
      game: {
        title: 'Sample game'
      },
      finished: (i >= 5),
      reason: 'install',
      progress: (i + 3) * 0.1,
      totalSize: i * 304138,
      pOsx: (i % 2 === 0)
    }
  }),
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
  }
  return {...state, downloads: newDownloads}
}

const reducer = handleActions({
  QUEUE_CAVE_UNINSTALL: uninstall,
  QUEUE_CAVE_REINSTALL: uninstall,

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
    const {id, err} = action.payload
    return updateSingle(state, action, {id, finished: true, err})
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
  downloadsByOrder: (state) => state.downloads::filter((x) => !x.finished)::sortBy('order')::pluck('id'),
  finishedDownloads: (state) => state.downloads::where({finished: true})::sortBy('order')::pluck('id'),
  downloadsByGameId: (state) => state.downloads::indexBy('gameId')
})

export default (state, action) => {
  const reducerFields = reducer(state, action)
  const additionalFields = selector(reducerFields)
  return {...reducerFields, ...additionalFields}
}
