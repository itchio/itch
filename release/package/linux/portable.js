
const $ = require('../../common')

module.exports = {
  packagePortable: async function (arch, buildPath) {
    $.say('Generating portable linux archive (.tar.xz)')
    const dirName = `${$.appName()}-${$.buildVersion()}-${arch}`
    $(await $.sh('rm -rf portable-stage'))
    $(await $.sh('mkdir -p portable-stage'))
    $(await $.sh(`cp -rf ${buildPath} portable-stage/${dirName}`))
    await $.cd('portable-stage', async () => {
      $(await $.sh(`tar cfJ ${dirName}.tar.xz ${dirName}`))
    })
    $(await $.sh(`mv portable-stage/${dirName}.tar.xz packages/`))
  }
}
