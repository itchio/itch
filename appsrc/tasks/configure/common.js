
import sniff from '../../util/sniff'
import sf from '../../util/sf'
import {partial} from 'underline'

import {opts} from '../../logger'
import mklog from '../../util/log'
const log = mklog('configure/common')

import path from 'path'

/**
 * Tries to find executables by sniffing file contents,
 * +x them, and return a list of them
 */
function fixExecs (field, basePath) {
  let f = sniffAndChmod::partial(field, basePath)

  return (
    sf.glob(`**`, {nodir: true, cwd: basePath})
    .map(f, {concurrency: 2})
    .filter((x) => !!x)
  )
}

async function sniffAndChmod (field, base, rel) {
  let file = path.join(base, rel)

  let type = await sniff.path(file)
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
