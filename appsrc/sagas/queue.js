
import {EventEmitter} from 'events'
import {call, put} from 'redux-saga/effects'

const ACTION_EVENT = 'action'

export default function (name) {
  const emitter = new EventEmitter()
  const actions = []

  const dispatch = (action) => {
    console.log(`${name}: dispatching ${action.type}`)
    actions.push(action)
    emitter.emit(ACTION_EVENT)
  }

  const pump = () => new Promise((resolve, reject) => {
    console.log(`${name}: pumping, ${actions.length} in queue`)
    const action = actions.pop()
    if (action) {
      console.log(`${name}: snatched early action, resolving`)
      return resolve(action)
    }

    console.log(`${name}: subscribing...`)
    const onAction = () => {
      console.log(`${name}: got event`)
      const action = actions.pop()
      if (action) {
        console.log(`${name}: emitting!`)
        resolve(action)
      } else {
        console.log(`${name}: false alarm`)
        emitter.once(ACTION_EVENT, onAction)
      }
    }
    emitter.once(ACTION_EVENT, onAction)
  })

  const exhaust = function * (endType = '<none>') {
    while (true) {
      console.log(`${name}: in while(true)`)
      const action = yield call(pump)
      console.log(`${name}: putting action ${action.type}`)
      yield put(action)
      console.log(`${name}: done putting action ${action.type}`)
      if (action.type === endType) {
        console.log(`${name}: was endType, stopping!`)
        return
      }
    }
  }

  return {dispatch, pump, exhaust}
}
