
const errors = require('./errors')
const CaveStore = require('../stores/cave-store')

async function start (opts) {
  let id = opts.id

  let cave = CaveStore.find(id)

  if (cave.launchable) {
    throw new errors.Transition({ to: 'check-for-update', reason: 'awakening' })
  } else {
    throw new errors.Transition({ to: 'find-upload', reason: 'not-installed' })
  }
}

module.exports = { start }
