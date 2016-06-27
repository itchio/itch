
import uuid from 'node-uuid'
import {handleActions} from 'redux-actions'
import {createSelector, createStructuredSelector} from 'reselect'

import invariant from 'invariant'
import {indexBy, where, sortBy, pluck, filter, map, first, omit} from 'underline'

const makeFakeDownloads = () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]::map((x, i) => {
  return {
    id: uuid.v4(),
    game: {
      title: 'Sample game'
    },
    finished: (i >= 5),
    reason: 'install',
    progress: (i + 3) * 0.1,
    totalSize: i * 304138,
    pOsx: (i % 2 === 0),
    order: -i
  }
})::indexBy('id')

const initialState = {
  downloads: (process.env.FAKE_DOWNLOADS === '1' ? makeFakeDownloads() : {}),
  downloadsPaused: false
}

const updateSingle = (state, action, record) => {
  const {downloads} = state
  const {id} = record
  invariant(id, 'valid download id in progress')

  const download = downloads[id]
  if (!download) {
    // ignore progress messages for inactive downloads
    return state
  }

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
  CLEAR_GAME_DOWNLOADS: (state, action) => {
    const {downloads} = state
    const {gameId} = action.payload

    const newDownloads = downloads::filter((x) => x.game.id !== gameId)::indexBy('id')
    return {...state, downloads: newDownloads}
  },

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

  PRIORITIZE_DOWNLOAD: (state, action) => {
    const {id} = action.payload
    const {downloads} = state
    const {activeDownload} = selector(state)

    if (!activeDownload || activeDownload.id === id) {
      // either no downloads, or only one. nothing to prioritize!
      console.log('nothing to prioritize')
      return state
    }

    // don't re-number priorities, just go into the negatives
    const order = activeDownload.order - 1
    console.log(`bumping ${id}'s order from ${downloads[id].order} to ${order}`)

    return updateSingle(state, action, {id, order})
  },

  CANCEL_DOWNLOAD: (state, action) => {
    const {id} = action.payload
    const {downloads} = state

    const download = downloads[id]
    invariant(download, 'cancelling valid download')

    const newDownloads = downloads::omit(id)

    return {
      ...state,
      downloads: newDownloads
    }
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

const structSel = createStructuredSelector({
  downloadsByOrder: (state) => state.downloads::filter((x) => !x.finished)::sortBy('order')::pluck('id'),
  activeDownload: (state) => state.downloads::filter((x) => !x.finished)::sortBy('order')::first(),
  finishedDownloads: (state) => state.downloads::where({finished: true})::sortBy('order')::pluck('id'),
  downloadsByGameId: (state) => state.downloads::indexBy('gameId')
})

const selector = createSelector(
  structSel,
  (fields) => {
    const {activeDownload} = fields
    const progress = (activeDownload && activeDownload.progress) || -1

    return {
      ...fields,
      activeDownload,
      progress
    }
  }
)

export default (state, action) => {
  const reducerFields = reducer(state, action)
  const additionalFields = selector(reducerFields)
  return {...reducerFields, ...additionalFields}
}
