
import {app} from '../electron'
import sf from '../util/sf'
import path from 'path'

import invariant from 'invariant'
import {map, indexBy} from 'underline'

import {takeEvery} from 'redux-saga'
import {put, call} from 'redux-saga/effects'
import client from '../util/api'

import {attemptLogin, loginFailed, loginSucceeded, sessionsRemembered} from '../actions'

import {
  BOOT,
  LOGIN_WITH_PASSWORD,
  LOGIN_SUCCEEDED,
  FORGET_SESSION
} from '../constants/action-types'

const TOKEN_FILE_NAME = 'token.json'
const USERS_PATH = path.join(app.getPath('userData'), 'users')

export function getSessionPath (userId) {
  return path.join(USERS_PATH, String(userId))
}

export function * _boot () {
  // not using '**', as that would find arbitrarily deep files
  const userIds = yield call(sf.glob, `*/${TOKEN_FILE_NAME}`, {cwd: USERS_PATH})
  const contents = yield userIds::map((userId) =>
    call(sf.readFile, path.join(USERS_PATH, userId, TOKEN_FILE_NAME))
  )
  const sessions = contents::map((content) => JSON.parse(content))

  if (sessions.length > 0) {
    const sessionsById = sessions::indexBy('userId')
    yield put(sessionsRemembered(sessionsById))
  }
}

export function * _forgetSession (action) {
  const userId = action.payload
  invariant(typeof userId !== 'undefined', 'forgetting session from a valid userId')
  const sessionPath = getSessionPath(userId)
  yield call(sf.wipe, sessionPath)
}

export function * _passwordLogin (action) {
  yield put(attemptLogin())

  try {
    const {username, password} = action.payload
    const key = yield* getKey(username, password)
    const keyClient = client.withKey(key)

    // validate API key and get user profile in one fell swoop
    const me = (yield call([keyClient, keyClient.me])).user
    yield put(loginSucceeded({key, me}))
  } catch (e) {
    yield put(loginFailed(e.errors || e.stack || e))
  }
}

export function * getKey (username, password) {
  const res = (yield call([client, client.loginWithPassword], username, password))
  return res.key.key
}

export function * _loginSucceeded (action) {
  const {key, me} = action.payload
  const {username} = me
  const userId = me.id

  const sessionPath = getSessionPath(userId)
  const content = JSON.stringify({
    userId,
    username,
    key
  })
  yield call(sf.writeFile, sessionPath, content)
}

export default function * loginSaga () {
  yield [
    takeEvery(BOOT, _boot),
    takeEvery(FORGET_SESSION, _forgetSession),
    takeEvery(LOGIN_SUCCEEDED, _loginSucceeded),
    takeEvery(LOGIN_WITH_PASSWORD, _passwordLogin)
  ]
}
