
import fnout from 'fnout'
import sf from '../../util/sf'
import {partial} from 'underscore'

// import {opts} from '../../logger'
// import mklog from '../../util/log'
const {opts} = require('../../logger')
const mklog = require('../../util/log').default
const log = mklog('configure/common')

import * as path from 'path'

export interface ConfigureResult {
  executables: Array<String>
}

/**
 * Tries to find executables by sniffing file contents,
 * +x them, and return a list of them
 */
export async function fixExecs (field: string, basePath: string): Promise<Array<string>> {
  // TODO: this sounds like a nice candidate for a butler command instead.
  // My (amos) instinct is that doing it in node generates a lot of garbage and can make the UI lag.
  const mapper = partial(sniffAndChmod, field, basePath)
  
  return sf.glob('**', {nodir: true, cwd: basePath}).map(mapper, {concurrency: 2}).filter((x: string) => !!x)
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

