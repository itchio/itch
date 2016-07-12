#!/usr/bin/env node

const $ = require('./common')
const ospath = require('path')

const pkg_path = ospath.resolve(__dirname, '..', 'package.json')

const pkg = JSON.parse($.read_file(pkg_path))
const pkg_version = pkg.version

let force = false
const args = []
process.argv.slice(2).forEach(function (arg) {
  switch (arg) {
    case '--force':
      $.say('(Running in forced mode)')
    default:
      if (/^--/.test(arg)) {
        throw new Error(`Unknown option ${arg}`)
      }
      args.push(arg)
  }
})

const version_input = args[0] || $.prompt(`Package version is: ${pkg.version}, type yours`)
if (!/^v\d+.\d+.\d+(-canary)?$/.test(version_input)) {
  throw new Error(`Version must be of the form /vX.Y.Z(-canary)?/ (was '${version_input}')`)
}

const next_version = version_input.replace(/^v/, '')

if (pkg_version != next_version) {
  if (!force) {
    $.yesno(`Bump package.json? [${pkg_version} => ${next_version}]`)
  }
  pkg.version = next_version
  $.write_file(pkg_path, JSON.stringify(pkg, 0, 2))
  $.say('Bumped package.json')
  $($.sh(`git add package.json`))
  $($.sh(`git commit -m ':arrow_up: ${next_version}'`))
}

const tag = `v${next_version}`
const add_cmd = `git tag -s -a ${tag} -m ${tag}`

if ($.sh(add_cmd)) {
  $.say('Tag added...')
} else {
  if (!force) {
    $.yesno('Tag already exists locally. Replace?')
  }
  $($.sh(`git tag -d ${tag}`))
  $($.sh(add_cmd))
}

const push_cmd = `git push origin ${tag}`
if ($.sh(push_cmd)) {
  $.say('Tag pushed...')
} else {
  if (!force) {
    $.yesno('Tag already exists on remote. Force-push?')
  }
  $($.sh(`${push_cmd} --force`))
}

$($.sh('git push'))
