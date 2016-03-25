
import makeMarketReducer from './make-market-reducer'
import {getGlobalMarket} from '../sagas/market'

import {createStructuredSelector} from 'reselect'
import {indexBy} from 'underline'

const reducer = makeMarketReducer('GLOBAL', getGlobalMarket)

const selector = createStructuredSelector({
  cavesByGameId: (state) => state.caves::indexBy('gameId')
})

export default (state, action) => {
  const reducerFields = reducer(state, action)
  const additionalFields = state ? selector(reducerFields) : {}
  return {...reducerFields, ...additionalFields}
}
