
import invariant from 'invariant'
import uuid from 'node-uuid'

import {log, opts} from './log'

import * as actions from '../../actions'

let orderSeed = 0

export async function startDownload (store, downloadOpts) {
  invariant(typeof store === 'object', 'startDownload must have a store')
  invariant(downloadOpts, 'startDownload cannot have null opts')
  invariant(downloadOpts.reason, 'startDownload must have a reason')
  invariant(downloadOpts.game, 'startDownload must have a game')
  invariant(typeof downloadOpts.totalSize === 'number', 'startDownload must have a total size')

  downloadOpts.order = orderSeed++

  const downloadsState = store.getState().downloads

  const existing = downloadsState.downloadsByGameId[downloadOpts.game.id]
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
}
