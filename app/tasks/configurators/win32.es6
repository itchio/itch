
import glob from '../../promised/glob'

let self = {
  configure: function (app_path) {
    return (
      glob(`${app_path}/**/*.@(exe|bat)`)
      .then((executables) => ({executables}))
    )
  }
}

export default self
