#!/usr/bin/env node

const VERSIONS_KEPT = 10
const $ = require('./common')

async function cleanBintray() {
  const args = process.argv.slice(2)
  if (args.length < 1) {
    $.say('usage: clean-bintray user:api_key')
    process.exit(1)
  }
  const userkey = args[0]

  const repos = ['deb', 'rpm']
  for (const repo of repos) {
    const listRes = await $.getOutput(`curl -u ${userkey} https://api.bintray.com/packages/itchio/${repo}/itch`)
    const list = JSON.parse(listRes)
    $.say(`got ${list.versions.length} ${repo} versions currently, latest is ${list.versions[0]}`)

    const deletedVersions = []
    for (let i = 0; i < list.versions.length; i++) {
      if (i < VERSIONS_KEPT) {
        continue
      }
      deletedVersions.unshift(list.versions[i])
    }

    if (deletedVersions.length === 0) {
      continue
    }

    await $.yesno(`delete ${deletedVersions.length} ${repo} versions? ${JSON.stringify(deletedVersions)}`)

    let i = 0
    for (const deletedVersion of deletedVersions) {
      $.say(`deleting v${deletedVersion} ${repo} (${deletedVersions.length - i} remaining)...`)
      $(await $.sh(`curl -u ${userkey} -X DELETE https://api.bintray.com/packages/itchio/${repo}/itch/versions/${deletedVersion}`))
      i++
    }
    $.say(`${deletedVersions.length} versions deleted`)
  }
}

cleanBintray()
