
import common from './common'

const self = {
  configure: async function (appPath) {
    let executables = await common.fixExecs('linuxExecutable', appPath)
    return {executables}
  }
}

export default self
