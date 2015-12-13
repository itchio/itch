
let path = require('path')

let spawn = require('./spawn')

let Logger = require('./log').Logger
let log = require('./log')('registry')

let opts = { logger: new Logger() }

let self = {

  base_key: `HKCU\\Software\\Classes\\itchio`,

  system32_path: path.join(process.env.SystemRoot, 'System32'),
  reg_path: path.join(self.system32_path, 'reg.exe'),

  reg_query: async function (key) {
    await spawn({
      command: self.reg_path,
      args: ['query', key, '/s']
    })
  },

  reg_add_default: async function (key, value) {
    await spawn({
      command: self.reg_path,
      args: ['add', key, '/ve', '/d', value, '/f']
    })
  },

  reg_add_empty: async function (key, value) {
    await spawn({
      command: self.reg_path,
      args: ['add', key, '/v', value, '/f']
    })
  },

  reg_delete_all: async function (key) {
    await spawn({
      command: self.reg_path,
      args: ['delete', key, '/va', '/f']
    })
  },

  install: async function (opts) {
    try {
      let base = self.base_key
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
      let base = self.base_key
      await self.reg_delete_all(base)
    } catch (e) {
      log(opts, `Could not register itchio:// as default protocol handler: ${e.stack || e}`)
    }
  }

}

module.exports = self
