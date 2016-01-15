
let errors = require('./errors')

let log = require('../util/log')('tasks/awaken')

let CaveStore = require('../stores/cave-store')
let find_upload = require('./find-upload')

async function start (opts) {
  let id = opts.id

  let cave = await CaveStore.find(id)

  if (!cave.launchable) {
    throw new errors.Transition({ to: 'find-upload', reason: 'not-installed' })
  }

  log(opts, `launchable cave, looking for fresher upload`)

  try {
    await find_upload.start(opts)
  } catch (err) {
    if (err instanceof errors.Transition && err.to === 'download') {
      let upload_id = err.data.upload_id
      if (upload_id !== cave.upload_id) {
        log(opts, `better download available (${cave.upload_id} => ${upload_id})`)
        throw err
      }
    }
  }

  // all good!
}

module.exports = { start }
