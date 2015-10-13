
import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'

import app from 'app'
import dialog from 'dialog'
import querystring from 'querystring'

import os from './os'

export function install () {
  process.on('uncaughtException', (e) => {
    try {
      // write crash log
      console.log(`Uncaught exception: ${e.stack}`)
      let platform = os.platform()
      let crash_file = path.join(app.getPath('userData'), 'crash_logs', `${+new Date()}.log`)
      mkdirp.sync(path.dirname(crash_file))

      let log = ''
      log += e.stack

      if (platform === 'win32') {
        log = log.replace(/\n/g, '\r\n')
      }
      fs.writeFileSync(crash_file, log)

      // try to show error dialog
      let response = dialog.showMessageBox({
        type: 'error',
        buttons: ['Report issue on GitHub', 'Open crash log', 'Close'],
        message: `The itch.io app crashed :(`,
        detail: `A crash log has been written to ${crash_file}.`
      })

      switch (response) {
        case 0: { // Report issue
          let query = querystring.stringify({
            title: `[${platform}] Crash report for v${app.getVersion()}`,
            body:
`Crash log:

\`\`\`
${log}
\`\`\`
`
          })
          require('shell').openExternal(`https://github.com/itchio/itchio-app/issues/new?${query}`)
          break
        }

        case 1: { // Open crash log
          require('shell').openItem(crash_file)
          break
        }

        default: {
          // muffin.
        }
      }
      console.log(`Got response: ${response}`)
    } catch (e) {
      // well, we tried.
      console.log(`Error in error handler: ${e.stack}`)
    } finally {
      process.exit(1)
    }
  })
}

export default { install }
