
import path from 'path'

import spawn from './spawn'

import mklog from './log'
const log = mklog('registry')
const opts = { logger: new mklog.Logger() }

let base = `HKCU\\Software\\Classes\\itchio`

let system_root = process.env.SystemRoot || 'missing-system-root'
let system32_path = path.join(system_root, 'System32')
let reg_path = path.join(system32_path, 'reg.exe')

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

  install: async function () {
    try {
      await self.reg_add_default(base, 'URL:itch.io protocol')
      await self.reg_add_empty(base, 'URL protocol')
      await self.reg_add_default(`${base}\\DefaultIcon`, 'itch.exe')
      await self.reg_add_default(`${base}\\Shell\\Open\\Command`, `"${process.execPath}" "%1"`)
    } catch (e) {
      log(opts, `Could not register itchio:// as default protocol handler: ${e.stack || e}`)
    }
  },

  update: async function () {
    await self.install()
  },

  uninstall: async function () {
    try {
      await self.reg_delete_all(base)
    } catch (e) {
      log(opts, `Could not register itchio:// as default protocol handler: ${e.stack || e}`)
    }
  }

}

export default self
