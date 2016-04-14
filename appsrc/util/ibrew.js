
import path from 'path'
import {app} from '../electron'
import os from './os'

import {partial} from 'underline'
import {call} from 'redux-saga/effects'

import mklog from './log'
const log = mklog('ibrew')
import extract from './extract'
import sf from './sf'

import formulas from './ibrew/formulas'
import version from './ibrew/version'
import net from './ibrew/net'

const defaultVersionCheck = {
  args: ['-V'],
  parser: /([a-zA-Z0-9\.]+)/
}

const self = {
  fetch: function * (opts, name) {
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

    const channel = net.channel(name)

    const downloadVersion = function * (v) {
      const archiveName = self.archiveName(name)
      const archivePath = path.join(self.binPath(), archiveName)
      const archiveUrl = `${channel}/v${v}/${archiveName}`
      onStatus('download', ['login.status.dependency_install', {name, version: v}])
      log(opts, `${name}: downloading '${v}' from ${archiveUrl}`)

      yield call(net.downloadToFile, opts, archiveUrl, archivePath)

      try {
        const sums = yield call(net.getSHA1Sums, opts, channel, v)
        const sum = sums[archiveName]
        if (sum) {
          const expected = sum.sha1.toLowerCase()
          log(opts, `${name}: expected SHA1: ${expected}`)
          const h = require('crypto').createHash('sha1')
          const fileContents = yield call(sf.fs.readFileAsync, archivePath, {encoding: 'binary'})
          h.update(fileContents)
          const actual = h.digest('hex')
          log(opts, `${name}:   actual SHA1: ${actual}`)

          if (expected !== actual) {
            throw new Error(`corrupted download for ${archiveName}: expected ${expected}, got ${actual}`)
          }
          log(opts, `${name}: checks out!`)
        }
      } catch (e) {
        log(opts, `${name}: couldn't get hashes, skipping verification (${e.message || '' + e})`)
      }

      if (formula.format === 'executable') {
        log(opts, `${name}: installed!`)
      } else {
        log(opts, `${name}: extracting ${formula.format} archive`)
        yield call(extract.extract, {
          archivePath,
          destPath: self.binPath()
        })
        log(opts, `${name}: installed!`)
      }
    }

    onStatus('stopwatch', ['login.status.dependency_check'])
    const getLatestVersion = net.getLatestVersion::partial(channel)

    const localVersion = yield call(self.getLocalVersion, name)

    if (!localVersion) {
      if (formula.onMissing) {
        formula.onMissing(os.platform())
      }
      log(opts, `${name}: missing, downloading latest`)
      const latestVersion = yield call(getLatestVersion)
      return yield call(downloadVersion, latestVersion)
    }

    let latestVersion
    try {
      latestVersion = yield call(getLatestVersion)
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
    yield call(downloadVersion, latestVersion)
  },

  archiveName: (name) => {
    let formula = formulas[name]

    if (formula.format === '7z') {
      return `${name}.7z`
    } else if (formula.format === 'executable') {
      return `${name}${self.ext()}`
    } else {
      throw new Error(`Unknown formula format: ${formula.format}`)
    }
  },

  getLocalVersion: function * (name) {
    const formula = formulas[name]
    const {versionCheck = {}} = formula

    const check = { ...defaultVersionCheck, ...versionCheck }

    try {
      const info = yield call(os.assertPresence, name, check.args, check.parser)
      return version.normalize(info.parsed)
    } catch (err) {
      // not present
      return null
    }
  },

  binPath: () => path.join(app.getPath('userData'), 'bin'),

  ext: () => (os.platform() === 'win32') ? '.exe' : ''
}

export default self
