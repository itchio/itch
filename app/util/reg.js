'use strict'

let path = require('path')

let spawn = require('./spawn')

let Logger = require('./log').Logger
let log = require('./log')('registry')

let opts = { logger: new Logger() }

let base = `HKCU\\Software\\Classes\\itchio`

let system_root = process.env.SystemRoot || 'missing-system-root'
let system32_path = path.join(system_root, 'System32')
let reg_path = path.join(system32_path, 'reg.exe')

let app_folder = path.resolve(process.execPath, '..')
let root_folder = path.resolve(app_folder, '..')
let update_exe_path = path.join(root_folder, 'Update.exe')
let exe_name = path.basename(process.execPath)

let self = {

  reg_query: async function (key) {
    await spawn({
      command: reg_path,
      args: ['query', key, '/s'],
      ontoken: (tok) => log(opts, `query: ` + tok)
    })
  },

  reg_add_default: async function (key, value) {
    await spawn({
      command: reg_path,
      args: ['add', key, '/ve', '/d', value, '/f']
    })
  },

  reg_add_empty: async function (key, value) {
    await spawn({
      command: reg_path,
      args: ['add', key, '/v', value, '/f']
    })
  },

  reg_delete_all: async function (key) {
    await spawn({
      command: reg_path,
      args: ['delete', key, '/f']
    })
  },

  update_run: async function (args) {
    await spawn({
      command: update_exe_path,
      args
    })
  },

  install: async function (opts) {
    try {
      await self.update_run(['--createShortcut', exe_name])
      await self.reg_add_default(base, 'URL:itch.io protocol')
      await self.reg_add_empty(base, 'URL protocol')
      await self.reg_add_default(`${base}\\DefaultIcon`, 'itch.exe')
      await self.reg_add_default(`${base}\\Shell\\Open\\Command`, `"${process.execPath}" "%1"`)
    } catch (e) {
      log(opts, `Could not register itchio:// as default protocol handler: ${e.stack || e}`)
    }
  },

  uninstall: async function () {
    try {
      await self.update_run(['--removeShortcut', exe_name])
      await self.reg_delete_all(base)
    } catch (e) {
      log(opts, `Could not register itchio:// as default protocol handler: ${e.stack || e}`)
    }
  }

}

module.exports = self
