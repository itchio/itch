
import {createStore, applyMiddleware, compose} from 'redux'
import {electronEnhancer} from 'redux-electron-store'
import createLogger from 'redux-logger'
import DevTools from '../components/dev-tools'

const filter = true
const middleware = []

if (process.env.NODE_ENV === 'development') {
  const logger = createLogger()
  middleware.push(logger)
}

const enhancer = compose(
  applyMiddleware(...middleware),
  electronEnhancer({filter, synchronous: false}),
  DevTools.instrument()
)

const reducer = (state, action) => state
const initialState = {}
const store = createStore(reducer, initialState, enhancer)

export default store
