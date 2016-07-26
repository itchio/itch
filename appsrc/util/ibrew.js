
import ospath from 'path'
import {app} from '../electron'
import os from './os'

import {partial} from 'underline'

import mklog from './log'
const log = mklog('ibrew')
import extract from './extract'
import targz from './targz'
import sf from './sf'
import spawn from './spawn'

import formulas from './ibrew/formulas'
import version from './ibrew/version'
import net from './ibrew/net'

const defaultVersionCheck = {
  args: ['-V'],
  parser: /([a-zA-Z0-9\.]+)/
}

const self = {
  fetch: async function (opts, name) {
    const noop = () => null
    const {onStatus = noop} = opts

    const formula = formulas[name]
    if (!formula) {
      throw new Error(`Unknown formula: ${name}`)
    }

    const osWhitelist = formula.osWhitelist
    if (osWhitelist && osWhitelist.indexOf(net.os()) === -1) {
      return
    }

    this.augmentPath(opts, formula.subfolder)

    const skipUpgradeWhen = formula.skipUpgradeWhen
    if (skipUpgradeWhen) {
      const reason = await skipUpgradeWhen({
        binPath: self.binPath()
      })
      if (reason) {
        log(opts, `${name}: skipping upgrade check (${reason})`)
        return
      }
    }

    const channel = net.channel(name)

    const downloadVersion = async function (v) {
      const archiveName = self.archiveName(name)
      const archivePath = ospath.join(self.binPath(), archiveName)
      const archiveUrl = `${channel}/v${v}/${archiveName}`
      onStatus('download', ['login.status.dependency_install', {name, version: v}])
      log(opts, `${name}: downloading '${v}' from ${archiveUrl}`)

      await net.downloadToFile(opts, archiveUrl, archivePath)

      let sums
      try {
        sums = await net.getSHA1Sums(opts, channel, v)
      } catch (e) {
        log(opts, `${name}: couldn't get hashes, skipping verification (${e.message || '' + e})`)
      }

      if (sums) {
        const sum = sums[archiveName]
        if (sum) {
          const expected = sum.sha1.toLowerCase()
          log(opts, `${name}: expected SHA1: ${expected}`)
          const h = require('crypto').createHash('sha1')
          // null encoding = raw buffer
          const fileContents = await sf.fs.readFileAsync(archivePath, {encoding: null})
          h.update(fileContents)
          const actual = h.digest('hex')
          log(opts, `${name}:   actual SHA1: ${actual}`)

          if (expected !== actual) {
            throw new Error(`corrupted download for ${archiveName}: expected ${expected}, got ${actual}`)
          }
          log(opts, `${name}: checks out!`)
        }
      }

      if (formula.format === 'executable') {
        log(opts, `${name}: installed!`)
      } else if (formula.format === '7z') {
        log(opts, `${name}: extracting ${formula.format} archive`)
        await extract.extract({
          archivePath,
          destPath: self.binPath()
        })
        log(opts, `${name}: cleaning up ${formula.format} archive`)
        await sf.wipe(archivePath)
      } else if (formula.format === 'tar.gz') {
        log(opts, `${name}: extracting ${formula.format} archive`)
        await targz.extract({
          archivePath,
          destPath: self.binPath()
        })
        log(opts, `${name}: cleaning up ${formula.format} arhcive`)
        await sf.wipe(archivePath)
      } else {
        throw new Error(`unsupported ibrew formula format: ${formula.format}`)
      }

      const {sanityCheck} = formula
      if (sanityCheck) {
        log(opts, `${name}: running sanity check ${JSON.stringify(sanityCheck)}`)

        const sanityRes = await spawn.exec(sanityCheck)
        if (sanityRes.code !== 0) {
          throw new Error(`sanity check for ${formula.name} failed with code ${sanityRes.code}, out = ${sanityRes.out}, err = ${sanityRes.err}`)
        }
      }
      log(opts, `${name}: installed!`)
    }

    onStatus('stopwatch', ['login.status.dependency_check'])
    const getLatestVersion = net.getLatestVersion::partial(channel)

    const localVersion = await self.getLocalVersion(name)

    if (!localVersion) {
      if (formula.onMissing) {
        formula.onMissing(os.platform())
      }
      log(opts, `${name}: missing, downloading latest`)
      const latestVersion = await getLatestVersion()
      return await downloadVersion(latestVersion)
    }

    let latestVersion
    try {
      latestVersion = await getLatestVersion()
    } catch (err) {
      log(opts, `${name}: cannot get latest version, skipping: ${err.message || err}`)
      return
    }

    if (version.equal(localVersion, latestVersion) ||
        localVersion === 'head') {
      log(opts, `${name}: have latest (${localVersion})`)
      return
    }

    log(opts, `${name}: upgrading '${localVersion}' => '${latestVersion}'`)
    await downloadVersion(latestVersion)
  },

  archiveName: (name) => {
    let formula = formulas[name]

    if (formula.format === '7z') {
      return `${name}.7z`
    } if (formula.format === 'tar.gz') {
      return `${name}.tar.gz`
    } else if (formula.format === 'executable') {
      return `${name}${self.ext()}`
    } else {
      throw new Error(`Unknown formula format: ${formula.format}`)
    }
  },

  getLocalVersion: async function (name) {
    const formula = formulas[name]
    const {versionCheck = {}} = formula

    const check = { ...defaultVersionCheck, ...versionCheck }

    try {
      const command = check.command ? check.command : name
      const info = await os.assertPresence(command, check.args, check.parser)
      return version.normalize(info.parsed)
    } catch (err) {
      console.log(`[ibrew] While checking version for ${name}: ${err.stack}`)

      // not present
      return null
    }
  },

  binPath: () => ospath.join(app.getPath('userData'), 'bin'),

  ext: () => (os.platform() === 'win32') ? '.exe' : '',

  augmentedPaths: {},

  augmentPath: function (opts, subfolder) {
    let binPath = self.binPath()
    if (subfolder) {
      binPath = ospath.join(binPath, subfolder)
    }
    if (self.augmentedPaths[binPath]) {
      return
    }
    self.augmentedPaths[binPath] = true
    log(opts, `Augmenting $PATH: ${binPath}`)

    process.env.PATH = `${binPath}${ospath.delimiter}${process.env.PATH}`
    return binPath
  }
}

export default self
