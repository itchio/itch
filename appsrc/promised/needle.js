
import Promise from 'bluebird'
import needle from 'needle'

import {app} from '../electron'
import os from '../util/os'

needle.defaults({
  user_agent: `itch/${app.getVersion()} (${os.platform()}; Electron/${os.getVersion('electron')} Chrome/${os.getVersion('chrome')})`
})

export default Promise.promisifyAll(needle)
