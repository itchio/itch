
import Promise from 'bluebird'

import mklog from '../../util/log'
const log = mklog('blessing')

const self = (out, opts) => {
  log(opts, `blessing: stub, assuming yes`)
  return Promise.resolve()

  // out.emit('progress', 0)
  // AppActions.cave_progress({id: opts.id, progress: 0, need_blessing: true})
  //
  // const cb = (resolve, reject) => {
  //   let onshine, oncancel
  //   const removeListeners = () => {
  //     opts.emitter.removeListener('shine', onshine).removeListener('cancel', oncancel)
  //     AppActions.cave_progress({id: opts.id, need_blessing: false})
  //   }
  //
  //   onshine = () => {
  //     remove_listeners()
  //     resolve()
  //   }
  //   opts.emitter.on('shine', onshine)
  //
  //   // FIXME the flow for cancelling blessing is unclear
  //   // (can't abort an installation at )
  //   oncancel = () => {
  //     removeListeners()
  //     reject(new Cancelled())
  //   }
  //   opts.emitter.on('cancel', oncancel)
  // }
  // return new Promise(cb)
}

export default self
