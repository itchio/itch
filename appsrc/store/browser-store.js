
import {createStore, applyMiddleware, compose} from 'redux'
import {electronEnhancer} from 'redux-electron-store'
import {install as reduxLoop} from 'redux-loop'
import reducer from '../reducers'

const middleware = []

const enhancer = compose(
  applyMiddleware(...middleware),
  electronEnhancer(),
  reduxLoop()
)

const initialState = {
  navigation: {
    page: 'login'
  }
}
const store = createStore(reducer, initialState, enhancer)

export default store
