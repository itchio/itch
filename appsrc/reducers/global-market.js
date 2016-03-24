
import makeMarketReducer from './make-market-reducer'
import {getGlobalMarket} from '../sagas/market'

export default makeMarketReducer('GLOBAL', getGlobalMarket)
