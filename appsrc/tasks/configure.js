
import os from '../util/os'
import {findWhere} from 'underline'

import mklog from '../util/log'
const log = mklog('tasks/configure')
import market from '../util/market'
import fetch from '../util/fetch'

import CaveStore from '../stores/cave-store'
import AppActions from '../actions/app-actions'

import html from './configure/html'

const self = {
  configure: async function (appPath) {
    const platform = os.platform()

    switch (platform) {
      case 'win32':
      case 'darwin':
      case 'linux':
        const configurator = require(`./configure/${platform}`).default
        return await configurator.configure(appPath)
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  },

  start: async function (opts) {
    const id = opts.id

    const cave = CaveStore.find(id)
    const game = await fetch.game_lazily(market, cave.game_id)

    const appPath = CaveStore.appPath(cave.install_location, id)
    log(opts, `configuring ${appPath}`)

    const uploads = cave.uploads
    if (!uploads) {
      throw new Error(`invalid cave (no uploads), cannot configure`)
    }

    const upload = cave.uploads::findWhere({id: cave.upload_id})
    if (!upload) {
      throw new Error(`invalid cave (upload not found), cannot configure`)
    }

    const launch_type = upload.type === 'html' ? 'html' : 'native'
    AppActions.update_cave(id, {launch_type})

    if (launch_type === 'html') {
      const res = await html.configure(game, appPath)
      AppActions.update_cave(id, res)
    } else {
      const executables = (await self.configure(appPath)).executables
      AppActions.update_cave(id, {executables})
    }
  }
}

export default self
