
import sf from '../../util/sf'

let self = {
  configure: async function (app_path) {
    let executables = await sf.glob('**/*.@(exe|bat|jar)', {
      cwd: app_path,
      nocase: true
    })
    return {executables}
  }
}

export default self
