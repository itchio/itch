
import {EventEmitter} from 'events'

import invariant from 'invariant'
import uuid from 'node-uuid'

import {log, opts} from './log'

import * as actions from '../../actions'
import download from '../../tasks/download'

export async function startDownload (store, downloadOpts) {
  invariant(typeof store === 'object', 'startDownload must have a store')
  invariant(downloadOpts, 'startDownload cannot have null opts')
  invariant(downloadOpts.reason, 'startDownload must have a reason')
  invariant(downloadOpts.game, 'startDownload must have a game')
  invariant(typeof downloadOpts.totalSize === 'number', 'startDownload must have a total size')

  const existing = store.getState().tasks.downloadsByGameId[downloadOpts.game.id]
  if (existing && !existing.finished) {
    log(opts, `Not starting another download for ${downloadOpts.game.title}`)
    store.dispatch(actions.navigate('downloads'))
    return
  }

  const {upload, downloadKey} = downloadOpts
  log(opts, `Should download ${upload.id}, has dl key ? ${!!downloadKey}`)

  const id = uuid.v4()
  // FIXME: wasteful but easy
  store.dispatch(actions.downloadStarted({id, ...downloadOpts, downloadOpts}))

  let err
  try {
    const out = new EventEmitter()
    out.on('progress', (progress) => {
      store.dispatch(actions.downloadProgress({id, progress}))
      store.dispatch(actions.setProgress(progress))
    })

    const credentials = store.getState().session.credentials
    const extendedOpts = {
      ...opts,
      ...downloadOpts,
      credentials
    }

    log(opts, 'Starting download...')
    store.dispatch(actions.setProgress(0))
    await download(out, extendedOpts)
  } catch (e) {
    log(opts, 'Download threw')
    err = e.task || e
  } finally {
    err = err ? err.message || err : null
    log(opts, `Download ended, err: ${err || '<none>'}`)
    store.dispatch(actions.downloadEnded({id, err, downloadOpts}))
    store.dispatch(actions.setProgress(-1))
  }

  log(opts, 'Download done!')
}
