
import pathmaker from '../util/pathmaker'
import {camelifyObject} from '../util/format'
import sf from '../util/sf'

import * as actions from '../actions'

import mklog from '../util/log'
const log = mklog('preferences')
import {opts} from '../logger'

export async function boot (store) {
  try {
    const contents = await sf.readFile(pathmaker.preferencesPath())
    const prefs = camelifyObject(JSON.parse(contents))

    log(opts, 'imported preferences: ', JSON.stringify(prefs, null, 2))
    store.dispatch(actions.updatePreferences(prefs))
  } catch (err) {
    log(opts, `while importing preferences: ${err}`)
  }
}

let _atomicInvocations = 0

export async function updatePreferences (store) {
  const prefs = store.getState().preferences

  // write prefs atomically
  const file = pathmaker.preferencesPath()
  const tmpPath = file + '.tmp' + (_atomicInvocations++)
  await sf.writeFile(tmpPath, JSON.stringify(prefs))
  await sf.rename(tmpPath, file)
}

export default {boot, updatePreferences}
