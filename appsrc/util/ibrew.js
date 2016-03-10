
import path from 'path'
import {app} from '../electron'
import os from './os'

import {partial} from 'underline'

import mklog from './log'
const log = mklog('ibrew')
import extract from './extract'

import formulas from './ibrew/formulas'
import version from './ibrew/version'
import net from './ibrew/net'

let default_version_check = {
  args: ['-V'],
  parser: /([a-zA-Z0-9\.]+)/
}

let self = {
  fetch: async (opts, name) => {
    let noop = () => null
    let onstatus = opts.onstatus || noop

    let formula = formulas[name]
    if (!formula) throw new Error(`Unknown formula: ${name}`)

    let os_whitelist = formula.os_whitelist
    if (os_whitelist && os_whitelist.indexOf(net.os()) === -1) {
      log(opts, `${name}: skipping, it's irrelevant on ${net.os()}`)
      return
    }

    const channel = net.channel(name)

    const download_version = async (v) => {
      const archive_name = self.archive_name(name)
      const archive_path = path.join(self.bin_path(), archive_name)
      const archive_url = `${channel}/v${v}/${archive_name}`
      onstatus('download', ['login.status.dependency_install', {name, version: v}])
      log(opts, `${name}: downloading '${v}' from ${archive_url}`)

      await net.download_to_file(opts, archive_url, archive_path)

      if (formula.format === 'executable') {
        log(opts, `${name}: installed!`)
      } else {
        log(opts, `${name}: extracting ${formula.format} archive`)
        await extract.extract({
          archive_path,
          dest_path: self.bin_path()
        })
        log(opts, `${name}: installed!`)
      }
    }

    onstatus('stopwatch', ['login.status.dependency_check'])
    const get_latest_version = net.get_latest_version::partial(channel)

    const local_version = await self.get_local_version(name)

    if (!local_version) {
      if (formula.on_missing) formula.on_missing(os.platform())
      log(opts, `${name}: missing, downloading latest`)
      return await download_version(await get_latest_version())
    }

    log(opts, `${name}: have local version '${local_version}'`)

    let latest_version
    try {
      latest_version = await get_latest_version()
    } catch (err) {
      log(opts, `${name}: cannot get latest version, skipping: ${err.message || err}`)
      return
    }

    if (version.equal(local_version, latest_version) ||
        local_version === 'head') {
      log(opts, `${name}: up-to-date`)
      return
    }

    log(opts, `${name}: upgrading '${local_version}' => '${latest_version}'`)
    await download_version(latest_version)
  },

  archive_name: (name) => {
    let formula = formulas[name]

    if (formula.format === '7z') {
      return `${name}.7z`
    } else if (formula.format === 'executable') {
      return `${name}${self.ext()}`
    } else {
      throw new Error(`Unknown formula format: ${formula.format}`)
    }
  },

  get_local_version: async (name) => {
    let formula = formulas[name]

    let check = Object.assign({}, default_version_check, formula.version_check || {})

    try {
      let info = await os.assert_presence(name, check.args, check.parser)
      return version.normalize(info.parsed)
    } catch (err) {
      // not present
      return null
    }
  },

  bin_path: () => path.join(app.getPath('userData'), 'bin'),

  ext: () => (os.platform() === 'win32') ? '.exe' : ''
}

export default self
