
import sf from '../../util/sf'

const self = {
  configure: async function (appPath) {
    const executables = await sf.glob('**/*.@(exe|bat|jar)', {
      cwd: appPath,
      nocase: true
    })
    return {executables}
  }
}

export default self
