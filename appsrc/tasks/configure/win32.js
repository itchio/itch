
let sf = require('../../util/sf')

let self = {
  configure: async function (app_path) {
    let executables = await sf.glob('**/*.@(exe|bat|jar)', {
      cwd: app_path,
      nocase: true
    })
    return {executables}
  }
}

module.exports = self
