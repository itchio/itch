
import * as actions from '../actions'
import client from '../util/api'

import {sortBy} from 'underline'

async function loginWithPassword (store, action) {
  const {username, password} = action.payload

  store.dispatch(actions.attemptLogin())

  try {
    const key = await getKey(username, password)
    const keyClient = client.withKey(key)

    // validate API key and get user profile in one fell swoop
    const me = (await keyClient.me()).user
    store.dispatch(actions.loginSucceeded({key, me}))
  } catch (e) {
    store.dispatch(actions.loginFailed({username, errors: e.errors || e.stack || e}))
  }
}

async function loginWithToken (store, action) {
  const {username, key} = action.payload

  store.dispatch(actions.attemptLogin())

  try {
    const keyClient = client.withKey(key)

    // validate API key and get user profile in one fell swoop
    const me = (await keyClient.me()).user
    store.dispatch(actions.loginSucceeded({key, me}))
  } catch (e) {
    const {me} = action.payload
    if (me && e.code === 'ENOTFOUND') {
      store.dispatch(actions.loginSucceeded({key, me}))
    } else {
      store.dispatch(actions.loginFailed({username, errors: e.errors || e.stack || e}))
    }
  }
}

async function getKey (username, password) {
  const res = await client.loginWithPassword(username, password)
  return res.key.key
}

async function sessionsRemembered (store, action) {
  const rememberedSessions = action.payload
  const mostRecentSession = rememberedSessions::sortBy((x) => -x.lastConnected)[0]
  if (mostRecentSession) {
    const {me, key} = mostRecentSession
    const {username} = me
    store.dispatch(actions.loginWithToken({username, key, me}))
  }
}

export default {loginWithPassword, loginWithToken, sessionsRemembered}
