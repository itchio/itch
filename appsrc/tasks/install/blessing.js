
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

    oncancel = () => {
      remove_listeners()
      let tr = new errors.Transition({
        to: 'idle',
        reason: 'no-blessing'
      })
      reject(tr)
    }
  }
  return new Promise(cb)
}

module.exports = self
