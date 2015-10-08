
import common from './common'

export function configure (app_path) {
  return (
    common.fix_execs(app_path)
    .then((executables) => ({executables}))
  )
}
