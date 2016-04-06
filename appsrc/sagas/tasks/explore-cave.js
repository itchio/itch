
import invariant from 'invariant'
import {call, put} from 'redux-saga/effects'
import {probeCave} from '../../actions'

import sf from '../../util/sf'
import pathmaker from '../../util/pathmaker'
import explorer from '../../util/explorer'

import {getGlobalMarket} from '../market'
import {log, opts} from './log'

export function * _exploreCave (action) {
  const {caveId} = action.payload
  invariant(caveId, 'actually have a caveId')
  const market = getGlobalMarket()

  const cave = market.getEntity('caves', caveId)
  if (!cave) {
    log(opts, `Cave not found, can't explore: ${caveId}`)
    return
  }
  const appPath = pathmaker.appPath(cave)

  const exists = yield call(sf.exists, appPath)
  if (exists) {
    explorer.open(appPath)
  } else {
    yield put(probeCave(action.payload))
  }
}
