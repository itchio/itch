
import {app} from '../electron'
import sf from '../util/sf'
import path from 'path'

import invariant from 'invariant'
import {map, indexBy} from 'underline'

import {takeEvery} from './effects'
import {put, call} from 'redux-saga/effects'

import {
  sessionsRemembered, sessionUpdated,
  forgetSession,
  openModal,
  startOnboarding
} from '../actions'

import {
  BOOT,
  LOGIN_SUCCEEDED,
  FORGET_SESSION,
  FORGET_SESSION_REQUEST
} from '../constants/action-types'

const TOKEN_FILE_NAME = 'token.json'
const USERS_PATH = path.join(app.getPath('userData'), 'users')

export function getTokenPath (userId) {
  return path.join(USERS_PATH, String(userId), TOKEN_FILE_NAME)
}

export function * loadRememberedSessions () {
  // not using '**', as that would find arbitrarily deep files
  const tokenFiles = yield call(sf.glob, `*/${TOKEN_FILE_NAME}`, {cwd: USERS_PATH, nodir: true})

  const contents = yield tokenFiles::map((tokenFile) =>
    call(sf.readFile, path.join(USERS_PATH, tokenFile))
  )
  const sessions = contents::map((content) => JSON.parse(content))

  if (sessions.length > 0) {
    const sessionsById = sessions::indexBy((x) => x.me.id)
    yield put(sessionsRemembered(sessionsById))
  }
}

export function * _boot () {
  yield * loadRememberedSessions()
}

export function * _forgetSessionRequest (action) {
  const {id, username} = action.payload
  yield put(openModal({
    title: ['prompt.forget_session.title'],
    message: ['prompt.forget_session.message', {username}],
    detail: ['prompt.forget_session.detail'],
    buttons: [
      {
        label: ['prompt.forget_session.action'],
        action: forgetSession({id, username}),
        icon: 'cross'
      },
      'cancel'
    ]
  }))
}

export function * _forgetSession (action) {
  const {id} = action.payload
  invariant(typeof id !== 'undefined', 'forgetting session from a valid user id')
  const tokenPath = getTokenPath(id)
  yield call(sf.wipe, tokenPath)
}

export function * saveSession (userId, record) {
  const tokenPath = getTokenPath(userId)
  let oldRecord = {}
  try {
    const oldContent = yield call(sf.readFile, tokenPath)
    oldRecord = JSON.parse(oldContent)
  } catch (e) {}

  const finalRecord = {...oldRecord, ...record, lastConnected: Date.now()}
  const content = JSON.stringify(finalRecord)
  yield call(sf.writeFile, tokenPath, content)

  // first time connecting?
  if (!oldRecord.lastConnected) {
    yield put(startOnboarding())
  }

  yield put(sessionUpdated({id: userId, record: finalRecord}))
}

export function * _loginSucceeded (action) {
  const {key, me} = action.payload
  yield * saveSession(me.id, {key, me})
}

export default function * rememberedSessionSaga () {
  yield [
    takeEvery(BOOT, _boot),
    takeEvery(FORGET_SESSION_REQUEST, _forgetSessionRequest),
    takeEvery(FORGET_SESSION, _forgetSession),
    takeEvery(LOGIN_SUCCEEDED, _loginSucceeded)
  ]
}
