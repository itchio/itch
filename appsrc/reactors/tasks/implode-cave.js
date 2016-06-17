
import invariant from 'invariant'

import {getGlobalMarket} from '../market'

export async function implodeCave (store, action) {
  const {caveId} = action.payload
  invariant(caveId, 'actually have a caveId')

  const market = getGlobalMarket()
  await market.deleteEntity('caves', caveId, {wait: true})
}
