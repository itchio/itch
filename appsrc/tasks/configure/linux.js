
import common from './common'

const self = {
  configure: async function (appPath) {
    let executables = await common.fix_execs('linux_executable', appPath)
    return {executables}
  }
}

export default self
