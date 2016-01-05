
let electron = require('electron')
let path = require('path')

let spawn = require('./spawn')
let fs = require('../promised/fs')

let Logger = require('./log').Logger
let log = require('./log')('shortcut')

let opts = { logger: new Logger() }

let app_folder = path.resolve(process.execPath, '..')
let root_folder = path.resolve(app_folder, '..')
let update_exe_path = path.join(root_folder, 'Update.exe')
let exe_name = path.basename(process.execPath)

let self = {
  update_run: async function (args) {
    log(opts, `Update.exe located at = ${update_exe_path}`)
    let code = await spawn({
      command: update_exe_path,
      args
    })
    log(opts, `Update.exe exited with code ${code}`)
    if (code !== 0) {
      throw new Error(`Update.exe exited with non-zero code ${code}`)
    }
  },

  create_or_update_shortcut: async function () {
    await self.update_run(['--createShortcut', exe_name])
  },

  update: async function () {
    let desktop_path = electron.app.getPath('desktop')
    let shortcut_path = path.join(desktop_path, 'itch.lnk')

    // find out if the user has deleted the desktop shortcut
    // cf. https://github.com/itchio/itch/issues/239
    let remove_desktop_shortcut = false

    try {
      await fs.lstatAsync(shortcut_path)
      log(opts, `Shortcut at ${shortcut_path} still exists, letting Squirrel do its thing`)
    } catch (e) {
      // shortcut was deleted by user, remove it after Squirrel recreates it
      remove_desktop_shortcut = true
      log(opts, `Shortcut at ${shortcut_path} has been deleted, preparing to re-delete`)
    }

    try {
      log(opts, `Updating shortcut with squirrel`)
      await self.create_or_update_shortcut()
      if (remove_desktop_shortcut) {
        log(opts, `Removing shortcut as requested`)
        await fs.unlinkAsync(shortcut_path)
      }
    } catch (e) {
      log(opts, `Could not update shortcut: ${e.stack || e}`)
    }
  },

  install: async function () {
    log(opts, `Creating shortcut with squirrel`)
    try {
      await self.create_or_update_shortcut()
    } catch (e) {
      log(opts, `Could not create shortcut: ${e.stack || e}`)
    }
  },

  uninstall: async function () {
    log(opts, `Removing shortcut with squirrel`)
    try {
      await self.update_run(['--removeShortcut', exe_name])
    } catch (e) {
      log(opts, `Could not remove shortcut: ${e.stack || e}`)
    }
  }

}

module.exports = self
