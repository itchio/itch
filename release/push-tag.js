#!/usr/bin/env node

const $ = require('./common')
const {resolve} = require('path')

async function pushTag() {
  const pkgPath = resolve(__dirname, '..', 'package.json')
  const pkg = JSON.parse(await $.readFile(pkgPath))
  const pkgVersion = pkg.version

  let force = false
  const args = []
  for (const arg of process.argv.slice(2)) {
    switch (arg) {
      case '--force':
        $.say('(Running in forced mode)')
        force = true
        break
      default:
        if (/^--/.test(arg)) {
          throw new Error(`Unknown option ${arg}`)
        }
        args.push(arg)
    }
  }

  const versionInput = args[0] || $.prompt(`Package version is: ${pkg.version}, type yours`)
  if (!/^v\d+.\d+.\d+(-canary)?$/.test(versionInput)) {
    throw new Error(`Version must be of the form /vX.Y.Z(-canary)?/ (was '${versionInput}')`)
  }

  const nextVersion = versionInput.replace(/^v/, '')

  if (pkgVersion !== nextVersion) {
    if (!force) {
      await $.yesno(`Bump package.json? [${pkgVersion} => ${nextVersion}]`)
    }
    pkg.version = nextVersion
    await $.writeFile(pkgPath, JSON.stringify(pkg, 0, 2))
    $.say('Bumped package.json')
    $(await $.sh('git add package.json'))
    $(await $.sh(`git commit -m ':arrow_up: ${nextVersion}'`))
  }

  const tag = `v${nextVersion}`
  const isCanary = /-canary$/.test(nextVersion)
  const addCmd = `git tag ${isCanary ? '' : '-s'} -a ${tag} -m ${tag}`

  if (await $.sh(addCmd)) {
    $.say('Tag added...')
  } else {
    if (!force) {
      await $.yesno('Tag already exists locally. Replace?')
    }
    $(await $.sh(`git tag -d ${tag}`))
    $(await $.sh(addCmd))
  }

  const pushCmd = `git push origin ${tag}`
  if (await $.sh(pushCmd)) {
    $.say('Tag pushed...')
  } else {
    if (!force) {
      await $.yesno('Tag already exists on remote. Force-push?')
    }
    $(await $.sh(`${pushCmd} --force`))
  }

  $(await $.sh('git push'))
}

pushTag()
