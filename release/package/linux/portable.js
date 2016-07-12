
const $ = require('../../common')

module.exports = {
  package_portable: function (arch, build_path) {
    $.say('Generating portable linux archive (.tar.xz)')
    const result = `packages/${$.app_name()}-${$.build_version()}-${arch}.tar.xz`
    $($.sh(`tar cfJ ${result} ${build_path}`))
  }
}
