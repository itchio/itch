'use nodent';'use strict'
'use nodent-promises';'use strict'

let fstream = require('fstream')
let path = require('path')

let app = require('app')
let shell = require('shell')
let dialog = require('dialog')
let querystring = require('querystring')

let os = require('./os')

let self = {
  write_crash_log: (e) => {
    let crash_file = path.join(app.getPath('userData'), 'crash_logs', `${+new Date()}.log`)

    let log = ''
    log += e.stack

    if (os.platform() === 'win32') {
      log = log.replace(/\n/g, '\r\n')
    }
    let writer = fstream.Writer({path: crash_file})
    writer.write(log)
    writer.end()

    return {log, crash_file}
  },

  report_issue: (log) => {
    let query = querystring.stringify({
      title: `[${os.platform()}] Crash report for v${app.getVersion()}`,
      body:
`Crash log:

\`\`\`
${log}
\`\`\`
`
    })
    shell.openExternal(`https://github.com/itchio/itchio-app/issues/new?${query}`)
  },

  handle: (e) => {
    console.log(`Uncaught exception: ${e.stack}`)
    let res = self.write_crash_log(e)
    let log = res.log
    let crash_file = res.crash_file

    // try to show error dialog
    let response = dialog.showMessageBox({
      type: 'error',
      buttons: ['Report issue on GitHub', 'Open crash log', 'Close'],
      message: `The itch.io app crashed :(`,
      detail: `A crash log has been written to ${crash_file}.`
    })

    if (response === 0) {
      self.report_issue(log)
    } else if (response === 1) {
      shell.openItem(crash_file)
    }
  },

  mount: () => {
    process.on('uncaughtException', (e) => {
      try {
        self.handle(e)
      } catch (e) {
        // well, we tried.
        console.log(`Error in crash-reporter\n${e.stack || e}`)
      } finally {
        process.exit(1)
      }
    })
  }
}

module.exports = self
