
import {createStore, applyMiddleware, compose} from 'redux'
import {electronEnhancer} from 'redux-electron-store'
import DevTools from '../components/dev-tools'

const filter = true
const middleware = []

const enhancer = compose(
  applyMiddleware(...middleware),
  electronEnhancer({filter}),
  DevTools.instrument()
)

const reducer = (state, action) => state
const initialState = {
  navigation: {
    page: 'login'
  }
}
const store = createStore(reducer, initialState, enhancer)

export default store
