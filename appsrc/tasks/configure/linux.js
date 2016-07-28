
import common from './common'

const SO_RE = /\.so(\.[^/])*$/i

const self = {
  configure: async function (appPath) {
    let executables = await common.fixExecs('linuxExecutable', appPath)
    executables = executables.filter((x) => {
      if (SO_RE.test(x)) {
        // ignore libraries
        return false
      }
      return true
    })
    return {executables}
  }
}

export default self
