
import mklog from '../util/log'
const log = mklog('reactors/perf')
import {opts} from '../logger'

import * as actions from '../actions'

import moment from 'moment'

let prebootTime
let bootTime
let loginTime
let pageTime
let done = false

async function preboot (store, action) {
  prebootTime = Date.now()
}

async function boot (store, action) {
  bootTime = Date.now()
}

async function loginSucceeded (store, action) {
  loginTime = Date.now()
}

async function firstUsefulPage (store, action) {
  if (done) {
    return
  }
  done = true

  pageTime = Date.now()
  log(opts, `preboot -> boot        = ${moment().diff(prebootTime, bootTime)} ms`)
  log(opts, `boot    -> login       = ${moment().diff(bootTime, loginTime)} ms`)
  log(opts, `login   -> first page  = ${moment().diff(loginTime, pageTime)} ms`)
  if (process.env.PROFILE_REQUIRE === '1') {
    store.dispatch(actions.quit())
  }
}

export default {preboot, boot, loginSucceeded, firstUsefulPage}
