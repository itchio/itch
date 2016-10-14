
import sf from '../../util/sf'

import {ConfigureResult} from './common'

const self = {
  configure: async function (appPath: string): Promise<ConfigureResult> {
    const executables = await sf.glob('**/*.@(exe|bat|jar)', {
      cwd: appPath,
      nocase: true
    })
    return {executables}
  }
}

export default self
