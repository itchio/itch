
let Promise = require('bluebird')
let errors = require('../errors')

let AppActions = require('../../actions/app-actions')

let self = (opts) => {
  AppActions.cave_progress({id: opts.id, progress: 0, need_blessing: true})

  let cb = (resolve, reject) => {
    let onshine, oncancel
    let remove_listeners = () => {
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
      reject(new errors.Cancelled())
    }
    opts.emitter.on('cancel', oncancel)
  }
  return new Promise(cb)
}

module.exports = self
