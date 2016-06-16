
import * as actions from '../actions'
import client from '../util/api'

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

export default {loginWithToken}
