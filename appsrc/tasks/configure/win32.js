
import sf from '../../util/sf'

const self = {
  configure: async function (app_path) {
    const executables = await sf.glob('**/*.@(exe|bat|jar)', {
      cwd: app_path,
      nocase: true
    })
    return {executables}
  }
}

export default self
