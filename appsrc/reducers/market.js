
import makeMarketReducer from './make-market-reducer'
import {getUserMarket} from '../sagas/market'

export default makeMarketReducer('USER', getUserMarket)
