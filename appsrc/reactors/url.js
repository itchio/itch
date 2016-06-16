
import invariant from 'invariant'
import urlParser from 'url'

import mklog from '../util/log'
const log = mklog('reactors/url')
import {opts} from '../logger'

import * as actions from '../actions'

let onSessionReady

async function sessionReady () {
  if (onSessionReady) {
    onSessionReady()
  }
}

async function handleItchioUrl (store, action) {
  invariant(typeof action.payload === 'object', 'handleItchioUrl payload is an object')

  const {uri} = action.payload
  invariant(typeof uri, 'handleItchioUrl uri is a string')

  log(opts, `Starting to handle itch.io url ${uri}`)
  const key = store.getState().session.credentials.key
  if (!key) {
    log(opts, 'Waiting for session to be ready before handling itchio url')
    await new Promise((resolve, reject) => { onSessionReady = resolve })
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
      store.dispatch(actions.navigate('games/' + gameId))
      break
    }

    default: {
      const resourcePath = url.hostname + url.pathname
      log(opts, `Opening resource directly: ${resourcePath}`)
      store.dispatch(actions.navigate(resourcePath))
    }
  }
}

export default {handleItchioUrl, sessionReady}
