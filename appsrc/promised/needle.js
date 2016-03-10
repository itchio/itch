
import Promise from 'bluebird'
import needle from 'needle'

import {app} from '../electron'
import os from '../util/os'

needle.defaults({
  user_agent: `itch/${app.getVersion()} (${os.platform()}; Electron/${os.get_version('electron')} Chrome/${os.get_version('chrome')})`
})

export default Promise.promisifyAll(needle)
