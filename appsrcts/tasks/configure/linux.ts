
import {ConfigureResult, fixExecs} from './common'

const SO_RE = /\.so(\.[^/])*$/i

const self = {
  configure: async function (appPath: string): Promise<ConfigureResult> {
    const executablesAndLibraries = await fixExecs('linuxExecutable', appPath)
    
    const executables = executablesAndLibraries.filter((x) => {
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
