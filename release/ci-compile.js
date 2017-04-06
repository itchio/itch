#!/usr/bin/env node

// compile itch for production environemnts

const $ = require('./common')

$.say(`Compiling ${$.app_name()}`)

$.show_versions(['npm', 'node'])

$($.npm('install'))

$.say('Compiling JavaScript')
process.env.NODE_ENV = 'production'
$($.grunt('ts sass copy'))

$.say('Preparing stage')
const stage_path = 'stage'
$($.sh(`rm -rf "${stage_path}"`))
$($.sh(`mkdir -p "${stage_path}"`))

$.say('Copying compiled code+assets...')
$($.sh(`cp -rf app node_modules "${stage_path}"`))

$.say('Generating custom package.json + environment')

const pkg = JSON.parse($.read_file('package.json'))
;['name', 'productName', 'desktopName'].forEach(function (field) {
  pkg[field] = $.app_name()
})

const env = {
  name: 'production',
  channel: $.channel_name()
}
$.write_file(`${stage_path}/package.json`, JSON.stringify(pkg, 0, 2))

const envjs = `
module.exports = ${JSON.stringify(env, 0, 2)}
`
$.write_file(`${stage_path}/app/env.js`, envjs)

$($.sh('tar cfz stage.tar.gz stage'))
