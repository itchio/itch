// base functions useful throughout CI scripts

const child_process = require('child_process')
const colors = require('colors')

const $ = {}

$.HOMEPAGE = 
$.HOMEPAGE = 'https://itch.io/app'
$.MAINTAINER = 'Amos Wenger <amos@itch.io>'
$.DESCRIPTION = 'The best way to play itch.io games'

$.BUILD_TIME = Date.now()

$.RETRY_COUNT = 5
$.HOME = process.env.HOME

$.OSES = {
  windows: {},
  darwin: {},
  linux: {}
}

$.ARCHES = {
  ['386']: {
    electron_arch: 'ia32'
  },
  amd64: {
    electron_arch: 'x64'
  }
}

// local golang executables
$.GOPATH = `${$.HOME}/go`
process.env.GOPATH = $.GOPATH
process.env.PATH += `:${$.GOPATH}/bin`

// local npm executables
process.env.PATH += `:${process.env.CWD}/bin`

$.VERSION_SPECS = {
  ['7za']: '7za | head -2',
  node: 'node --version',
  npm: 'npm --version',
  gsutil: 'gsutil --version',
  go: 'go version',
  gothub: 'gothub --version',
  fakeroot: 'fakeroot -v',
  ar: 'ar --version | head -1'
}

$.putln = function (s) {
  process.stdout.write(s + '\n')
  return true
}

$.show_versions = function (names) {
  names.forEach(function (name) {
    const v =  $.♫($.VERSION_SPECS[name]).trim()
    $.putln `★ ${name} ${v}`.yellow
  })
  return true
}

$.say = function (cmd) {
  $.putln(`♦ ${cmd}`.yellow)
  return true
}

function system (cmd) {
  try {
    child_process.execSync(cmd, {
      stdio: 'inherit'
    })
  } catch (err) {
    $.putln(`☃ ${err.toString()}`.red)
    return false
  }
  return true
}

$.sh = function (cmd) {
  $.putln(`· ${cmd}`.blue)
  return system(cmd)
}

$.qsh = function (cmd) {
  $.putln(`· <redacted>`.blue)
  return system(cmd)
}

// run npm command (silently)
$.npm = function (args) {
  return $.sh(`npm --no-progress --quiet ${args}`)
}

// run gem command
$.gem = function (args) {
  return $.sh `gem ${args}`
}

// run grunt command
$.grunt = function (args) {
  return $.sh `grunt ${args}`
}

// run go command
$.go = function (args) {
  return $.sh `go ${args}`
}

// copy files to google cloud storage using gsutil
$.gcp = function (args) {
  return $.sh `gsutil -m cp -r -a public-read ${args}`
}

// manage github assets
$.gothub = function (args) {
  process.env.GITHUB_USER = 'itchio'
  process.env.GITHUB_REPO = $.app_name
  return $.sh `gothub`
}

module.exports = $

