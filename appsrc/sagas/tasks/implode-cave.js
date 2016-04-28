
import invariant from 'invariant'
import {call} from 'redux-saga/effects'

import {getGlobalMarket} from '../market'

export function * _implodeCave (action) {
  const {caveId} = action.payload
  invariant(caveId, 'actually have a caveId')

  const market = getGlobalMarket()
  yield call([market, market.deleteEntity], 'caves', caveId, {wait: true})
}
