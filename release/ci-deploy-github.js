#!/usr/bin/env node

// create upcoming github release whenever a tag is pushed.
// will remove existing release if any, allowing us to
// force-push tags gone bad. this is only useful for cosmetic
// reasons (no weird version number skips)

const $ = require('./common')
const ospath = require('path')

$($.go_dep('gothub', 'github.com/itchio/gothub'))
$.show_versions(['gothub'])

const raw_tags = $.get_output('git for-each-ref --sort=taggerdate --format \'%(refname) %(taggerdate)\' refs/tags')
// refs/tags/v17.3.0-canary Sat May 7 15:46:38 2016 +0200
// refs/tags/v17.3.0-canary
// v17.3.0-canary
const all_tags = raw_tags.split('\n').map(function (x) {
  const tokens = x.split(' ')[0].split('/')
  return tokens[tokens.length - 1]
})

let relevant_tags
switch ($.channel_name()) {
  case 'canary':
    relevant_tags = all_tags.filter(function (x) {
      return /-canary$/.test(x)
    })
    break
  case 'stable':
    relevant_tags = all_tags.filter(function (x) {
      return /^[^-]+$/.test(x)
    })
    break
  default:
    throw new Error(`Unknown channel: ${$.channel_name()}`)
}

const previous_tag = relevant_tags[relevant_tags.length - 2] // last but one
const build_tag = $.build_tag()
$.say(`Creating changelog from ${previous_tag} to ${build_tag}`)

const rawlog = $.get_output(`git log --oneline --no-merges ${previous_tag}..${build_tag}`)
// 83c7b2f :bug: Fix menu links
//   * :bug: Fix menu links
const changelog = rawlog.split('\n')
  .filter(function (x) { return !/Translated using Weblate/.test(x) })
  .map(function (x) { return x.replace(/^\S+\s/g, '  * ') })
  .join('\n')
$.say(`Changelog:\n${changelog}`)

$.say('Deleting release if any...')
if (!$.gothub(`delete --tag ${build_tag}`)) {
  $.putln(`First build for ${build_tag}`)
}

$.say('Creating release...')
$($.gothub(`release --tag ${build_tag} --draft --description "${changelog.replace(/`/g, '\\`')}"`))

$.say('Uploading assets...')
$.find_all_files('packages').forEach(function (name) {
  $.retry(function () {
    return $.gothub(`upload --tag ${build_tag} --name ${ospath.basename(name)} --file ${name} --replace`)
  })
})
