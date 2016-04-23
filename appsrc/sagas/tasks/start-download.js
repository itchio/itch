
import {EventEmitter} from 'events'

import invariant from 'invariant'
import uuid from 'node-uuid'
import createQueue from '../queue'

import {race, select, call, put} from 'redux-saga/effects'
import {log, opts} from './log'

import * as actions from '../../actions'
import download from '../../tasks/download'

export function * startDownload (downloadOpts) {
  invariant(downloadOpts, 'startDownload cannot have null opts')
  invariant(downloadOpts.reason, 'startDownload must have a reason')
  invariant(downloadOpts.game, 'startDownload must have a game')
  invariant(downloadOpts.totalSize, 'startDownload must have a total size')

  const existing = yield select((state) => state.tasks.downloadsByGameId[downloadOpts.game.id])
  if (existing && !existing.finished) {
    log(opts, `Not starting another download for ${downloadOpts.game.title}`)
    yield put(actions.navigate('downloads'))
    return
  }

  const {upload, downloadKey} = downloadOpts
  log(opts, `Should download ${upload.id}, dl key ? ${downloadKey}`)

  const id = uuid.v4()
  yield put(actions.downloadStarted({id, ...downloadOpts}))

  let err
  try {
    const queue = createQueue(`download-${id}`)

    const out = new EventEmitter()
    out.on('progress', (progress) => {
      queue.dispatch(actions.downloadProgress({id, progress}))
    })

    const credentials = yield select((state) => state.session.credentials)
    const extendedOpts = {
      ...opts,
      ...downloadOpts,
      credentials
    }

    log(opts, `Starting download...`)
    yield race({
      task: call(download, out, extendedOpts),
      queue: call(queue.exhaust)
    })
  } catch (e) {
    log(opts, `Download threw`)
    err = e.task || e
  } finally {
    log(opts, `Download ended, err: ${err ? err.stack || JSON.stringify(err) : '<none>'}`)
    yield put(actions.downloadEnded({id, err, downloadOpts}))
  }

  log(opts, `Download done!`)
}
