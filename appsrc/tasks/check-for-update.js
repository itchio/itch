
import mklog from '../util/log'
const log = mklog('tasks/awaken')

import CaveStore from '../stores/cave-store'
import find_upload from './find-upload'

import mkcooldown from '../util/cooldown'
const cooldown = mkcooldown(500)

async function start (opts) {
  const id = opts.id
  const cave = CaveStore.find(id)

  log(opts, `launchable cave, looking for fresher upload`)

  try {
    await cooldown()
    await find_upload.start(opts)
  } catch (err) {
    if (err.type === 'transition' && err.to === 'download') {
      const upload_id = err.data.upload_id
      if (upload_id !== cave.upload_id) {
        log(opts, `better download available (${cave.upload_id} => ${upload_id})`)
        throw err
      }
    }
  }

  // all good!
}

export default { start }
