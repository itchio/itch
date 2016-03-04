
import common from './common'

const self = {
  configure: async function (app_path) {
    let executables = await common.fix_execs('linux_executable', app_path)
    return {executables}
  }
}

export default self
