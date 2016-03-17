
import {app} from '../electron'
import sf from '../util/sf'
import path from 'path'

import invariant from 'invariant'
import {map, indexBy} from 'underline'

import {takeEvery} from 'redux-saga'
import {put, call} from 'redux-saga/effects'
import client from '../util/api'

import {
  attemptLogin,
  loginFailed, loginSucceeded,
  sessionsRemembered, startOnboarding
} from '../actions'

import {
  BOOT,
  LOGIN_WITH_PASSWORD,
  LOGIN_WITH_TOKEN,
  LOGIN_SUCCEEDED,
  FORGET_SESSION
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
  yield* loadRememberedSessions()
}

export function * _forgetSession (action) {
  const userId = action.payload
  invariant(typeof userId !== 'undefined', 'forgetting session from a valid userId')
  const tokenPath = getTokenPath(userId)
  yield call(sf.wipe, tokenPath)
}

export function * _loginWithPassword (action) {
  const {username, password} = action.payload

  yield put(attemptLogin())

  try {
    const key = yield* getKey(username, password)
    const keyClient = client.withKey(key)

    // validate API key and get user profile in one fell swoop
    const me = (yield call([keyClient, keyClient.me])).user
    yield put(loginSucceeded({key, me}))
  } catch (e) {
    yield put(loginFailed({username, errors: e.errors || e.stack || e}))
  }
}

export function * _loginWithToken (action) {
  const {username, key} = action.payload

  yield put(attemptLogin())

  try {
    const keyClient = client.withKey(key)

    // validate API key and get user profile in one fell swoop
    const me = (yield call([keyClient, keyClient.me])).user
    yield put(loginSucceeded({key, me}))
  } catch (e) {
    yield put(loginFailed({username, errors: e.errors || e.stack || e}))
  }
}

export function * getKey (username, password) {
  const res = (yield call([client, client.loginWithPassword], username, password))
  return res.key.key
}

export function * saveSession (userId, record) {
  const tokenPath = getTokenPath(userId)
  let oldRecord = {}
  try {
    const oldContent = yield call(sf.readFile, tokenPath)
    oldRecord = JSON.parse(oldContent)
  } catch (e) {}

  const content = JSON.stringify({...oldRecord, ...record, lastConnected: Date.now()})
  yield call(sf.writeFile, tokenPath, content)

  // first time connecting?
  if (!oldRecord.lastConnected) {
    yield put(startOnboarding())
  }
}

export function * _loginSucceeded (action) {
  const {key, me} = action.payload
  yield* saveSession(me.id, {key, me})
}

export default function * loginSaga () {
  yield [
    takeEvery(BOOT, _boot),
    takeEvery(FORGET_SESSION, _forgetSession),
    takeEvery(LOGIN_SUCCEEDED, _loginSucceeded),
    takeEvery(LOGIN_WITH_PASSWORD, _loginWithPassword),
    takeEvery(LOGIN_WITH_TOKEN, _loginWithToken)
  ]
}
