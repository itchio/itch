#!/usr/bin/env node

// uploads .deb and .rpm files to bintray

const $ = require('./common')

if ($.channel_name() === 'canary') {
  $.say('Skipping bintray deploy for canary versions')
  process.exit(0)
}

$.say('Deploying to Bintray!')
$.gem_dep('dpl', 'dpl')

$($.sh('mkdir -p build'))

var date = $.build_time()
const release_date = `${date.getUTCFullYear()}-${$.left_pad('' + date.getUTCMonth(), 2, '0')}-${$.left_pad('' + date.getUTCDate(), 2, '0')}`
$.say(`Release date: ${release_date}`)

;['rpm', 'deb'].forEach(function (repo) {
  ;['386', 'amd64'].forEach(function (arch) {
    $.say(`Uploading ${arch} to ${repo} repo...`)

    const deb_arch = $.to_deb_arch(arch)
    const rpm_arch = $.to_rpm_arch(arch)

    // auto-publish releases, it's too easy to forget flipping the switch otherwise
    const publish = true

    let conf = $.read_file(`release/templates/bintray.${repo}.json.in`)
    conf = conf.replace(/{{CI_APPNAME}}/g, $.app_name())
    conf = conf.replace(/{{CI_VERSION}}/g, $.build_version())
    conf = conf.replace(/{{CI_RELEASE_DATE}}/g, release_date)
    conf = conf.replace(/{{CI_PUBLISH}}/g, '' + publish)
    conf = conf.replace(/{{DEB_ARCH}}/g, deb_arch)
    conf = conf.replace(/{{RPM_ARCH}}/g, rpm_arch)
    $.write_file('build/bintray.json', conf)

    $($.qsh(`dpl --provider=bintray --file=build/bintray.json --user=fasterthanlime --key="${process.env.BINTRAY_TOKEN}"`))
  })
})
