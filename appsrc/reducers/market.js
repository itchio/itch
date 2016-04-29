
import makeMarketReducer from './make-market-reducer'
import {getUserMarket} from '../sagas/market'

import {LOGOUT} from '../constants/action-types'

const reducer = makeMarketReducer('USER', getUserMarket)

export default (state, action) => {
  // FIXME: this is a workaround, shouldn't be needed,
  // but without it, sessionReady fires too soon on 2nd login
  if (action.type === LOGOUT) {
    return {...state, ready: false}
  } else {
    return reducer(state, action)
  }
}
