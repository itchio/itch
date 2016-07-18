
import makeMarketReducer from './make-market-reducer'
import {getGlobalMarket} from '../reactors/market'

import {createSelector, createStructuredSelector} from 'reselect'
import {indexBy} from 'underline'

import derivedReducer from './derived-reducer'

const reducer = makeMarketReducer('GLOBAL', getGlobalMarket, ['caves'])

export default derivedReducer(reducer, createSelector(
  (state) => state.caves,
  createStructuredSelector({
    // TODO: remove unnecessary data duplication
    cavesByGameId: (caves) => caves::indexBy('gameId')
  })
))
