
import Promise from 'bluebird'
import {EventEmitter} from 'events'

import {isCancelError} from 'redux-saga'
import {call, put} from 'redux-saga/effects'

const ACTION_EVENT = 'action'

export default function createQueue (name) {
  const emitter = new EventEmitter()
  const actions = []

  const dispatch = (action) => {
    actions.push(action)
    setImmediate(() => emitter.emit(ACTION_EVENT))
  }

  const pump = () => new Promise((resolve, reject) => {
    if (actions.length > 0) {
      setImmediate(resolve)
    }
    emitter.once(ACTION_EVENT, resolve)
  })

  const exhaust = function * (opts = {}) {
    const {endType = '<none>'} = opts

    // FIXME: redux-saga and redux-electron-enhancer are still not very good friends :(
    let dispatch = null
    if (process.type === 'renderer') {
      let store
      dispatch = (action) => {
        if (!store) {
          store = require('../store').default
        }
        store.dispatch(action)
      }
    }

    try {
      while (true) {
        yield call(pump)
        const action = actions.pop()

        if (action) {
          if (dispatch) {
            dispatch(action)
          } else {
            yield put(action)
          }
          if (endType && action.type === endType) {
            return
          }
        }
      }
    } catch (e) {
      if (isCancelError(e)) {
        // all good
      } else {
        console.log('in queue.exhaust: ', e.stack || e)
      }
    }
  }

  return {dispatch, pump, exhaust}
}
