
import spawn from '../spawn'

import common from './common'

export async function check () {
  const needs = []
  const errors = []

  const seRes = await spawn.exec({command: 'sandbox-exec', args: ['-n', 'no-network', 'true']})
  if (seRes.code !== 0) {
    errors.push('sandbox-exec is missing. Is OSX too old?')
  }

  return {needs, errors}
}

export async function install (opts, needs) {
  return await common.tendToNeeds(opts, needs, {})
}

export async function uninstall (opts) {
  return {errors: []}
}

export default {check, install, uninstall}
