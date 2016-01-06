
let spawn = require('../../util/spawn')
let glob = require('../../promised/glob')
let fs = require('../../promised/fs')

let AppActions = require('../../actions/app-actions')

let errors = require('../errors')

let log = require('../../util/log')('installers/air')

let path = require('path')

// Adobe Air docs: http://help.adobe.com/en_US/air/redist/WS485a42d56cd19641-70d979a8124ef20a34b-8000.html

let MANIFEST_GLOB = '**/META-INF/AIR/application.xml'
let ID_RE = /<id>(.*)<\/id>/
let CODE_MESSAGES = {
  1: 'Successful, but restart required for completion',
  2: 'Usage error (incorrect arguments)',
  3: 'Runtime not found',
  4: 'Loading runtime failed',
  5: 'Unknown error',
  6: 'Installation canceled',
  7: 'Installation failed',
  8: 'Installation failed; update already in progress',
  9: 'Installation failed; application already installed'
}

let self = {
  install: async function (opts) {
    if (!opts.has_user_blessing) {
      throw new errors.Transition({
        to: 'ask-before-install',
        reason: `going to pop up an UAC dialog, need user's permission first`
      })
    }

    AppActions.cave_progress({id: opts.id, progress: -1})

    let archive_path = opts.archive_path
    let dest_path = opts.dest_path

    let spawn_opts = {
      command: 'elevate.exe',
      args: [
        archive_path, // the installer
        '-silent', // run the installer silently
        '-eulaAccepted', // let AIR install if it so wishes
        '-location', dest_path // install where we want to
      ],
      ontoken: (token) => log(opts, token)
    }
    let code = await spawn(spawn_opts)
    log(opts, `air installer exited with code ${code}`)

    if (code !== 0) {
      let message = CODE_MESSAGES[code]
      throw new Error(`AIR installer error: ${message}`)
    }

    log(opts, `Locating app manifest`)

    let candidates = await glob(MANIFEST_GLOB, {cwd: dest_path})
    if (candidates.length === 0) {
      throw new Error(`Adobe AIR app manifest not found, cannot uninstall`)
    }

    log(opts, `Found app manifest at ${candidates[0]}`)

    let manifest_path = path.join(dest_path, candidates[0])
    let manifest_contents = await fs.readFileAsync(manifest_path, {encoding: 'utf8'})
    let matches = ID_RE.exec(manifest_contents)
    if (!matches) {
      throw new Error(`Could not extract app id from manifest at ${manifest_path}`)
    }

    let appid = matches[1]
    log(opts, `Found appid ${appid}, remembering`)
    AppActions.cave_update(opts.id, {air_appid: appid})
  },

  uninstall: async function (opts) {
    AppActions.cave_progress({id: opts.id, progress: -1})

    log(opts, `Grabbing adobe's Air Runtime Helper if needed...`)

    let logger = opts.logger

    let ibrew = require('../../util/ibrew')
    let ibrew_opts = {
      logger,
      onstatus: (msg) => log(opts, `ibrew status: ${msg}`)
    }
    await ibrew.fetch(ibrew_opts, 'arh')

    let cave = opts.cave
    let appid = cave.air_appid
    if (!appid) {
      log(opts, `No appid, skipping arh uninstall`)
      return
    }

    log(opts, `Uninstalling appid ${appid}`)

    let spawn_opts = {
      command: 'elevate.exe',
      args: [
        'arh.exe',
        '-uninstallAppSilent',
        appid
      ],
      ontoken: (tok) => log(opts, `arh: ${tok}`)
    }
    let code = await spawn(spawn_opts)
    if (code !== 0) {
      throw new Error(`arh uninstall failed with code ${code}`)
    }
    AppActions.cave_update(opts.id, {air_appid: null})

    log(opts, `Uninstallation successful`)
  }
}

module.exports = self
