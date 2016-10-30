
import delay from './delay'

import * as actions from '../actions'
import moment from 'moment-timezone'

import mklog from '../util/log'
const log = mklog('updater')
const opts = {
  logger: new mklog.Logger({
    sinks: {
      console: true
    }
  })
}

// 30 minutes, * 60 = seconds, * 1000 = milliseconds
const HALLOWEEN_CHECK_DELAY = 30 * 60 * 1000

const HALLOWEEN_START = moment(new Date(new Date().getFullYear(), 9, 15))
const HALLOWEEN_END = moment(new Date(new Date().getFullYear(), 10, 3))

export function isHalloween () {
  var now = moment.tz(Date.now(), 'UTC').tz(moment.tz.guess())
  return (HALLOWEEN_START <= now && now <= HALLOWEEN_END)
}

function halloweenCheck (store) {
  const bonuses = store.getState().status.bonuses
  const spooky = isHalloween()

  if (spooky && !bonuses.halloween) {
    store.dispatch(actions.enableBonus({name: 'halloween'}))
  }

  if (!spooky && bonuses.halloween) {
    store.dispatch(actions.disableBonus({name: 'halloween'}))
  }
}

async function boot (store, action) {
  while (true) {
    try {
      halloweenCheck(store)
    } catch (e) {
      log(opts, `Got error: ${e.stack || e.message || e}`)
    }
    await delay(HALLOWEEN_CHECK_DELAY)
  }
}

export default {boot}
