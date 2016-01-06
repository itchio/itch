
let glob = require('../../promised/glob')

let self = {
  configure: async function (app_path) {
    let executables = await glob('**/*.@(exe|bat)', {
      cwd: app_path,
      nocase: true
    })
    return {executables}
  }
}

module.exports = self
