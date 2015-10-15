
import glob from '../../promised/glob'

export function configure (app_path) {
  return (
    glob(`${app_path}/**/*.@(exe|bat)`)
    .then((executables) => ({executables}))
  )
}
