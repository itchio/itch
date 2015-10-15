
import common from './common'

let self = {
  configure: function (app_path) {
    return (
      common.fix_execs(app_path)
      .then((executables) => ({executables}))
    )
  }
}

export default self
