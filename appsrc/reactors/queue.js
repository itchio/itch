
import invariant from 'invariant'
import Promise from 'bluebird'
import {EventEmitter} from 'events'

const ACTION_EVENT = 'action'

export default function createQueue (store, name) {
  invariant(typeof store === 'object', 'queue needs a store')
  invariant(typeof store === 'object', 'queue needs a name')

  const emitter = new EventEmitter()
  const actions = []
  let open = true

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

  const close = () => {
    open = false
  }

  const exhaust = async function (opts = {}) {
    try {
      while (open) {
        await pump()
        const action = actions.pop()

        if (action) {
          store.dispatch(action)
        }
      }
    } catch (e) {
      console.log('in queue.exhaust: ', e.stack || e)
    }
  }

  return {dispatch, pump, exhaust, close}
}
