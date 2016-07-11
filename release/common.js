// base functions useful throughout CI scripts

const child_process = require('child_process')
const fs = require('fs')
const ospath = require('path')

process.env.COLORTERM = '1'
require('./colors') // patches String.prototype to provide .yellow, .red, etc

const $ = function (val) {
  if (!val) {
    throw new Error('Exit code assertion failed, bailing out')
  }
}

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
process.env.PATH += `:${ospath.resolve(__dirname, '..', 'node_modules')}/bin`

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
    const v = $.get_output($.VERSION_SPECS[name]).trim()
    $.putln(`★ ${name} ${v}`.yellow)
  })
  return true
}

$.say = function (cmd) {
  $.putln(`♦ ${cmd}`.yellow)
  return true
}

function system (cmd, opts = {}) {
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
  $.putln('· <redacted>'.blue)
  return system(cmd)
}

// run npm command (silently)
$.npm = function (args) {
  return $.sh(`npm --no-progress --quiet ${args}`)
}

// run gem command
$.gem = function (args) {
  return $.sh(`gem ${args}`)
}

// run grunt command
$.grunt = function (args) {
  return $.sh(`grunt ${args}`)
}

// run go command
$.go = function (args) {
  return $.sh(`go ${args}`)
}

// copy files to google cloud storage using gsutil
$.gcp = function (args) {
  return $.sh(`gsutil -m cp -r -a public-read ${args}`)
}

// manage github assets
$.gothub = function (args) {
  process.env.GITHUB_USER = 'itchio'
  process.env.GITHUB_REPO = $.app_name
  return $.sh(`gothub ${args}`)
}

$.go_dep = function (cmd, pkg) {
  if (system(`which ${cmd} > /dev/null`)) {
    $.putln(`★ got ${cmd}`.yellow)
    return true
  } else {
    $.putln(`☁ installing ${cmd}`.yellow)
    return $.go(`get ${pkg}`)
  }
}

$.gem_dep = function (cmd, pkg) {
  if (system(`which ${cmd} > /dev/null`)) {
    $.putln(`★ got ${cmd}`.yellow)
    return true
  } else {
    $.putln(`☁ installing ${cmd}`.yellow)
    return $.gem(`install ${pkg}`)
  }
}

$.npm_dep = function (cmd, pkg) {
  if (system(`which ${cmd} > /dev/null`)) {
    $.putln(`★ got ${cmd}`.yellow)
    return true
  } else {
    $.putln(`☁ installing ${cmd}`.yellow)
    return $.npm(`install ${pkg}`)
  }
}

$.ensure = $

$.retry = function (cb) {
  var tries = 0
  while (tries < $.RETRY_COUNT) {
    if (tries > 0) {
      $.say(`Command failed, waiting 30s then trying ${$.RETRY_COUNT - tries} more time(s).`)
      // naughty, but don't want to pull in node-sleep (native modules)
      // or turn everything into async (babel-cli = huge)
      system('sleep 30')
    }
    if (cb()) {
      // cmd returned truthy value, was successful
      return
    }
    tries++
  }
  throw new Error(`Tried ${$.RETRY_COUNT} times, bailing out`)
}

$.get_output = function (cmd) {
  const out = child_process.execSync(cmd, {
    encoding: 'utf8'
  })
  // console.log('cmd = ', cmd)
  // console.log('out = ', out)
  return out
}

$.prompt = function (msg) {
  process.stdout.write(`${msg} (y/n)`)
  var s = 'n'
  fs.readSync(process.stdin, s, 0, 1, 0)
  process.stdout.write('\n')

  if (s !== 'y') {
    $.say('Bailing out...')
    process.exit(0)
  }
}

$.cd = function (dir, cb) {
  const original_wd = ospath.resolve(__dirname, '..')
  var e
  var ret

  $.putln(`☞ entering ${dir}`)
  process.chdir(dir)
  try {
    ret = cb()
  } catch (err) {
    e = err
  } finally {
    $.putln(`☜ leaving ${dir}`)
    process.chdir(original_wd)
  }

  if (e) {
    throw e
  }
  return ret
}

// environment variables etc.

$.build_ref_name = function () {
  const v = process.env.CI_BUILD_REF_NAME
  if (!v) {
    throw new Error('No build ref!')
  }
  return v
}

$.build_tag = function () {
  const v = process.env.CI_BUILD_TAG
  if (!v) {
    throw new Error('No build tag!')
  }
  return v
}

$.build_version = function () {
  return $.build_tag().replace(/^v/, '').replace(/-.+$/, '')
}

$.app_name = function () {
  if (/-canary$/.test($.build_tag())) {
    return 'kitch'
  } else {
    return 'itch'
  }
}

$.channel_name = function () {
  if (/-canary$/.test($.build_tag())) {
    return 'canary'
  } else {
    return 'stable'
  }
}

$.to_deb_arch = function (arch) {
  switch (arch) {
    case '386': return 'i386'
    case 'amd64': return 'amd64'
    default: throw new Error(`Unsupported arch ${arch}`)
  }
}

$.to_rpm_arch = function (arch) {
  switch (arch) {
    case '386': return 'i386'
    case 'amd64': return 'x86_64'
    default: throw new Error(`Unsupported arch ${arch}`)
  }
}

$.build_time = function () {
  return $.BUILD_TIME
}

module.exports = $
