

let fstream = require('fstream')
let path = require('path')

let app = require('electron').app
let shell = require('electron').shell
let dialog = require('electron').dialog
let querystring = require('querystring')

let os = require('./os')

let self = {
  repo_url: 'https://github.com/itchio/itch',

  open_url: function (url) {
    require('electron').shell.openExternal(url)
  },

  write_crash_log: (e) => {
    let crash_file = path.join(app.getPath('userData'), 'crash_logs', `${+new Date()}.txt`)

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

  report_issue: (opts) => {
    if (typeof opts === 'undefined') {
      opts = {}
    }

    let log = opts.log
    let body = opts.body || ''
    let type = opts.type || 'Issue'
    let before = opts.before || ''

    if (typeof log !== 'undefined') {
      type = 'Crash report'
      body =
`Crash log:

\`\`\`
${log}
\`\`\`
`
    }

    let query = querystring.stringify({
      title: `[${os.platform()}] ${type} for v${app.getVersion()}`,
      body: (before + body)
    })
    self.open_url(`https://github.com/itchio/itch/issues/new?${query}`)
  },

  handle: (e) => {
    console.log(`Uncaught exception: ${e.stack}`)
    let res = self.write_crash_log(e)
    let log = res.log
    let crash_file = res.crash_file

    let i18n
    try {
      i18n = require('../stores/i18n-store').get_state()
    } catch (e) {
      console.log(`While loading i18n for crash report: ${e.stack || e}`)
      i18n = {
        t: (x, opts) => {
          if (typeof opts === 'undefined') {
            opts = {}
          }
          if (opts.defaultValue) {
            return opts.defaultValue
          }
          return x
        }
      }
    }

    // try to show error dialog
    // supplying defaultValues everywhere in case the i18n system hasn't loaded yet
    let response = dialog.showMessageBox({
      type: 'error',
      buttons: [
        i18n.t('prompt.crash_reporter.report_issue', {defaultValue: 'Report issue'}),
        i18n.t('prompt.crash_reporter.open_crash_log', {defaultValue: 'Open crash log'}),
        i18n.t('prompt.action.close', {defaultValue: 'Close'})
      ],
      message: i18n.t('prompt.crash_reporter.message', {defaultValue: 'The application has crashed'}),
      detail: i18n.t('prompt.crash_reporter.detail', {defaultValue: `A crash log was written to ${crash_file}`, location: crash_file})
    })

    if (response === 0) {
      self.report_issue({log})
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
