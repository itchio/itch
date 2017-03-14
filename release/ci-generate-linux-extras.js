#!/usr/bin/env node

// generate extra Linux distribution files like .desktop, or .6 (man)

const $ = require('./common')
const ospath = require('path')

$($.sh('rm -rf linux-extras'))
$($.sh('mkdir -p linux-extras'))

// generate .desktop file
$.say('Generating desktop file')
let desktop = $.read_file('release/templates/io.itch.itch.desktop.in')
const locales_dir = 'appsrc/static/locales'
const locale_names = $.ls(locales_dir).filter(function (x) { return /\.json$/i.test(x) })
locale_names.forEach(function (locale_name) {
  const locale_path = ospath.join(locales_dir, locale_name)
  const locale_data = JSON.parse($.read_file(locale_path))
  const lang = locale_name.replace(/\.json$/i, '')
  const comm = locale_data['desktop.shortcut.comment']
  if (comm) {
    if (/englitch/.test(lang)) {
      return
    }
    desktop += `Comment[${lang}]=${comm}\n`
  }
})
desktop = desktop.replace(/{{APPNAME}}/g, $.app_name())
$.write_file(`linux-extras/io.itch.${$.app_name()}.desktop`, desktop)

// generate man page for itch(6)
$.say('Generating man file')

// alright future amos, let's take a bet that this will come back to bite you.
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const month = MONTH_NAMES[$.build_time().getUTCMonth()]
const year = $.build_time().getUTCFullYear()
let man = $.read_file('release/templates/itch.6.in')
man = man.replace(/{{APPNAME}}/g, $.app_name().toUpperCase())
man = man.replace(/{{MONTH}}/g, month)
man = man.replace(/{{YEAR}}/g, year)
$.write_file(`linux-extras/${$.app_name()}.6`, man)

// generate AppStream appdata file
$.say('Generating AppStream appdata file')
let appdata = $.read_file('release/templates/itch.appdata.xml')
appdata = appdata.replace(/{{APPNAME}}/g, $.app_name())
appdata = appdata.replace(/{{YEAR}}/g, year)
$.write_file(`linux-extras/${$.app_name()}.appdata.xml`, appdata)

