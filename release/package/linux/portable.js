
const $ = require('../../common')

module.exports = {
  package_portable: function (arch, build_path) {
    $.say('Generating portable linux archive (.tar.xz)')
    const dir_name = `${$.app_name()}-${$.build_version()}-${arch}`
    $($.sh('rm -rf portable-stage'))
    $($.sh('mkdir -p portable-stage'))
    $($.sh(`cp -rfv ${build_path} portable-stage/${dir_name}`))
    $.cd('portable-stage', function () {
      $($.sh(`tar cfJ ${dir_name}.tar.xz ${dir_name}`))
    })
    $($.sh(`mv portable-stage/${dir_name}.tar.xz packages/`))
  }
}
