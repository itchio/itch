
import fnout from 'fnout'
// import sf from '../../util/sf'
const sf = require('../../util/sf').default
import {partial} from 'underscore'

// import {opts} from '../../logger'
const {opts} = require('../../logger')
// import mklog from '../../util/log'
const mklog = require('../../util/log').default
const log = mklog('configure/common')

import * as path from 'path'

/**
 * Tries to find executables by sniffing file contents,
 * +x them, and return a list of them
 */
function fixExecs (field, basePath): Array<string> {
  const f = partial(sniffAndChmod, field, basePath)

  return (
    sf.glob('**', {nodir: true, cwd: basePath})
    .map(f, {concurrency: 2})
    .filter((x) => !!x)
  )
}

async function sniffAndChmod (field: string, base: string, rel: string): Promise<string> {
  let file = path.join(base, rel)

  let type = await fnout.path(file)
  if (type && type[field]) {
    try {
      await sf.chmod(file, 0o777)
    } catch (e) {
      log(opts, `Could not chmod ${file}: ${e.message}`)
    }
    return rel
  }
}

export default {fixExecs}

