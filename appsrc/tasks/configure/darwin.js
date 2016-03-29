
import Promise from 'bluebird'
import path from 'path'

import common from './common'
import sf from '../../util/sf'

const ignore_patterns = [
  // skip some typical junk we find in archives that's supposed
  // to be hidden / in trash / isn't in anyway relevant to what
  // we're trying to do
  '**/__MACOSX/**'
]

const self = {
  configure: async function (cavePath) {
    const bundles = await sf.glob(`**/*.app/`, {
      cwd: cavePath,
      ignore: ignore_patterns
    })

    if (bundles.length) {
      const fixer = (x) => common.fixExecs('macExecutable', path.join(cavePath, x))
      await Promise.each(bundles, fixer)
      return {executables: bundles}
    }

    // some games aren't properly packaged app bundles but rather a shell
    // script / binary - try it the linux way
    const executables = await common.fixExecs('macExecutable', cavePath)
    return {executables}
  }
}

export default self
