
import {app} from '../electron'
import sf from '../util/sf'
import path from 'path'

import invariant from 'invariant'
import {map, indexBy} from 'underline'

import * as actions from '../actions'

const TOKEN_FILE_NAME = 'token.json'
const USERS_PATH = path.join(app.getPath('userData'), 'users')

export function getTokenPath (userId) {
  return path.join(USERS_PATH, String(userId), TOKEN_FILE_NAME)
}

async function loadRememberedSessions (store) {
  // not using '**', as that would find arbitrarily deep files
  const tokenFiles = await sf.glob(`*/${TOKEN_FILE_NAME}`, {cwd: USERS_PATH, nodir: true})

  const contents = await Promise.all(tokenFiles::map((tokenFile) =>
    sf.readFile(path.join(USERS_PATH, tokenFile))
  ))
  const sessions = contents::map((content) => JSON.parse(content))

  if (sessions.length > 0) {
    const sessionsById = sessions::indexBy((x) => x.me.id)
    store.dispatch(actions.sessionsRemembered(sessionsById))
  }
}

async function boot (store) {
  await loadRememberedSessions(store)
}

async function forgetSessionRequest (store, action) {
  const {id, username} = action.payload
  store.dispatch(actions.openModal({
    title: ['prompt.forget_session.title'],
    message: ['prompt.forget_session.message', {username}],
    detail: ['prompt.forget_session.detail'],
    buttons: [
      {
        label: ['prompt.forget_session.action'],
        action: actions.forgetSession({id, username}),
        icon: 'cross'
      },
      'cancel'
    ]
  }))
}

async function forgetSession (store, action) {
  const {id} = action.payload
  invariant(typeof id !== 'undefined', 'forgetting session from a valid user id')
  const tokenPath = getTokenPath(id)
  await sf.wipe(tokenPath)
}

async function saveSession (store, userId, record) {
  invariant(typeof store === 'object', 'saveSession needs store object')

  const tokenPath = getTokenPath(userId)
  let oldRecord = {}
  try {
    const oldContent = await sf.readFile(tokenPath)
    oldRecord = JSON.parse(oldContent)
  } catch (e) {}

  const finalRecord = {...oldRecord, ...record, lastConnected: Date.now()}
  const content = JSON.stringify(finalRecord)
  await sf.writeFile(tokenPath, content)

  // first time connecting?
  if (!oldRecord.lastConnected) {
    store.dispatch(actions.startOnboarding())
  }

  store.dispatch(actions.sessionUpdated({id: userId, record: finalRecord}))
}

async function loginSucceeded (store, action) {
  const {key, me} = action.payload
  await saveSession(store, me.id, {key, me})
}

export default {boot, forgetSessionRequest, forgetSession, loginSucceeded}
