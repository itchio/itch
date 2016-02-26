
let app = require('electron').app
let path = require('path')
let os = require('./os')

import { partial } from 'underline'

let extract = require('./extract')
let log = require('./log')('ibrew')

let formulas = require('./ibrew/formulas')
let version = require('./ibrew/version')
let net = require('./ibrew/net')

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

    let channel = net.channel(name)

    let download_version = async (v) => {
      let archive_name = self.archive_name(name)
      let archive_path = path.join(self.bin_path(), archive_name)
      let archive_url = `${channel}/v${v}/${archive_name}`
      onstatus('login.status.dependency_install', 'download', {name, version: v})
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

    onstatus('login.status.dependency_check', 'stopwatch')
    let get_latest_version = net.get_latest_version::partial(channel)

    let local_version = await self.get_local_version(name)

    if (!local_version) {
      if (formula.on_missing) formula.on_missing()
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

module.exports = self
