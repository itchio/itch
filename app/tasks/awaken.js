
let Transition = require('./errors').Transition

let log = require('../util/log')('tasks/awaken')

let CaveStore = require('../stores/cave-store')
let find_upload = require('./find-upload')

async function start (opts) {
  let id = opts.id

  let cave = await CaveStore.find(id)

  if (cave.launchable) {
    log(opts, `launchable cave, looking for fresher upload`)

    let old_upload_id = cave.upload_id
    await find_upload.start(opts)

    let cave_new = await CaveStore.find(id)
    if (cave_new.upload_id !== old_upload_id) {
      let reason = `better download available! (${old_upload_id} => ${cave_new.upload_id})`
      throw new Transition({
        to: 'download',
        reason
      })
    }

    // all good!
  } else {
    let reason = 'Not installed successfully earlier, going through whole dance'
    throw new Transition({
      to: 'find-upload',
      reason
    })
  }
}

module.exports = { start }
