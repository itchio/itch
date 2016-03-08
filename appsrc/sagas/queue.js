
import {EventEmitter} from 'events'
import {call, put} from 'redux-saga/effects'

const ACTION_EVENT = 'action'

export default function (name) {
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

  const exhaust = function * (endType = '<none>') {
    while (true) {
      yield call(pump)
      const action = actions.pop()
      if (action) {
        yield put(action)
        if (endType && action.type === endType) {
          return
        }
      }
    }
  }

  return {dispatch, pump, exhaust}
}
