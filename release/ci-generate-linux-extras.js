#!/usr/bin/env node

// generate extra Linux distribution files like .desktop, or .6 (man)

const $ = require('./common')
const {join} = require('path')

async function generateLinuxExtras() {
  $(await $.sh('rm -rf linux-extras'))
  $(await $.sh('mkdir -p linux-extras'))

  // generate .desktop file
  $.say('Generating desktop file')
  let desktop = await $.readFile('release/templates/io.itch.itch.desktop.in')
  const localesDir = 'appsrc/static/locales'
  const localeNames = (await $.ls(localesDir)).filter((x) => /\.json$/i.test(x))

  for (const localeName of localeNames) {
    const localePath = join(localesDir, localeName)
    const localeData = JSON.parse(await $.readFile(localePath))
    const lang = localeName.replace(/\.json$/i, '')
    const comm = localeData['desktop.shortcut.comment']
    if (comm) {
      if (/englitch/.test(lang)) {
        return
      }
      desktop += `Comment[${lang}]=${comm}\n`
    }
  }
  desktop = desktop.replace(/{{APPNAME}}/g, $.appName())
  await $.writeFile(`linux-extras/io.itch.${$.appName()}.desktop`, desktop)

  // generate man page for itch(6)
  $.say('Generating man file')

  // alright future amos, let's take a bet that this will come back to bite you.
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const month = MONTH_NAMES[$.buildTime().getUTCMonth()]
  const year = $.buildTime().getUTCFullYear()
  let man = await $.readFile('release/templates/itch.6.in')
  man = man.replace(/{{APPNAME}}/g, $.appName().toUpperCase())
  man = man.replace(/{{MONTH}}/g, month)
  man = man.replace(/{{YEAR}}/g, year)
  await $.writeFile(`linux-extras/${$.appName()}.6`, man)

  // generate AppStream appdata file
  $.say('Generating AppStream appdata file')
  let appdata = await $.readFile('release/templates/itch.appdata.xml')
  appdata = appdata.replace(/{{APPNAME}}/g, $.appName())
  appdata = appdata.replace(/{{YEAR}}/g, year)
  await $.writeFile(`linux-extras/${$.appName()}.appdata.xml`, appdata)
}

generateLinuxExtras()
