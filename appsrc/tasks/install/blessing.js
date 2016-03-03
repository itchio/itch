
import Promise from 'bluebird'
import {Cancelled} from '../errors'

import AppActions from '../../actions/app-actions'

const self = (opts) => {
  AppActions.cave_progress({id: opts.id, progress: 0, need_blessing: true})

  const cb = (resolve, reject) => {
    let onshine, oncancel
    const remove_listeners = () => {
      opts.emitter.removeListener('shine', onshine).removeListener('cancel', oncancel)
      AppActions.cave_progress({id: opts.id, need_blessing: false})
    }

    onshine = () => {
      remove_listeners()
      resolve()
    }
    opts.emitter.on('shine', onshine)

    // FIXME the flow for cancelling blessing is unclear
    // (can't abort an installation at )
    oncancel = () => {
      remove_listeners()
      reject(new Cancelled())
    }
    opts.emitter.on('cancel', oncancel)
  }
  return new Promise(cb)
}

export default self
