
import invariant from 'invariant'
import {takeEvery} from 'redux-saga'
import {put, take, select} from 'redux-saga/effects'

import urlParser from 'url'

import mklog from '../util/log'
const log = mklog('sagas/url')
import {opts} from '../logger'

import {
  navigate
} from '../actions'

import {
  SESSION_READY,
  HANDLE_ITCHIO_URL
} from '../constants/action-types'

export function * _handleItchioUrl (action) {
  invariant(typeof action.payload === 'object', 'handleItchioUrl payload is an object')
  const {uri} = action.payload
  invariant(typeof uri, 'handleItchioUrl uri is a string')

  log(opts, `Starting to handle itch.io url ${uri}`)
  const key = yield select((state) => state.session.credentials.key)
  if (!key) {
    log(opts, 'Waiting for session to be ready before handling itchio url')
    yield take(SESSION_READY)
  }

  const url = urlParser.parse(uri)

  const verb = url.hostname
  const tokens = url.pathname.split('/')

  switch (verb) {
    case 'install':
    case 'launch': {
      if (!tokens[1]) {
        log(opts, 'for install: missing game, bailing out.')
        return
      }
      const gameId = tokens[1]
      yield put(navigate('games/' + gameId))
      break
    }

    default: {
      const resourcePath = url.hostname + url.pathname
      log(opts, `Opening resource directly: ${resourcePath}`)
      yield put(navigate(resourcePath))
    }
  }
}

export default function * urlSaga () {
  yield [
    takeEvery(HANDLE_ITCHIO_URL, _handleItchioUrl)
  ]
}
