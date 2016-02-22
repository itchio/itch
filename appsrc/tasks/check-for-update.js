
let log = require('../util/log')('tasks/awaken')

let CaveStore = require('../stores/cave-store')
let find_upload = require('./find-upload')

let cooldown = require('../util/cooldown')(500)

async function start (opts) {
  let id = opts.id
  let cave = await CaveStore.find(id)

  log(opts, `launchable cave, looking for fresher upload`)

  try {
    await cooldown()
    await find_upload.start(opts)
  } catch (err) {
    if (err.type === 'transition' && err.to === 'download') {
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
