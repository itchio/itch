
import * as actions from '../actions'

import {importLegacyDBs} from './preboot/import-legacy-dbs'
import {cleanOldLogs} from './preboot/clean-old-logs'

import {opts} from '../logger'
import mklog from '../util/log'
const log = mklog('preboot')

async function preboot (store) {
  try {
    await importLegacyDBs(log, opts)
  } catch (e) {
    console.log(`Could not import legacy db: ${e.stack || e.message || e}`)
  }

  try {
    await cleanOldLogs(log, opts)
  } catch (e) {
    console.log(`Could not clean old logs: ${e.stack || e.message || e}`)
  }

  store.dispatch(actions.boot())

  // print various machine specs, see docs/
  const diego = require('../util/diego').default
  setTimeout(function () {
    diego.hire(opts)
  }, 3000)
}

export default {preboot}
