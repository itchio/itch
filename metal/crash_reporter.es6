
export function install () {
  process.on('uncaughtException', (e) => {
    try {
      // write crash log
      let app = require('app')
      console.log(`Uncaught exception: ${e.stack}`)
      let fs = require('fs')
      let path = require('path')
      let mkdirp = require('mkdirp')
      let platform = require('./util/os').platform()
      let crash_file = path.join(app.getPath('userData'), 'crash_logs', `${+new Date()}.log`)
      mkdirp.sync(path.dirname(crash_file))

      let log = ''
      log += e.stack

      if (platform === 'win32') {
        log = log.replace(/\n/g, '\r\n')
      }
      fs.writeFileSync(crash_file, log)

      // try to show error dialog
      let dialog = require('dialog')
      let response = dialog.showMessageBox({
        type: 'error',
        buttons: ['Report issue on GitHub', 'Open crash log', 'Close'],
        message: `The itch.io app crashed :(`,
        detail: `A crash log has been written to ${crash_file}.`
      })

      switch (response) {
        case 0: { // Report issue
          let querystring = require('querystring')
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
