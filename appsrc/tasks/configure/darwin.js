
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
  configure: async function (cave_path) {
    const bundles = await sf.glob(`**/*.app/`, {
      cwd: cave_path,
      ignore: ignore_patterns
    })

    if (bundles.length) {
      const fixer = (x) => common.fix_execs('mac_executable', path.join(cave_path, x))
      await Promise.each(bundles, fixer)
      return {executables: bundles}
    }

    // some games aren't properly packaged app bundles but rather a shell
    // script / binary - try it the linux way
    const executables = await common.fix_execs('mac_executable', cave_path)
    return {executables}
  }
}

export default self
