
import sf from '../util/sf'
import path from 'path'

// TODO: reduce dependency on electron to allow easier testing
import electron from 'electron'
let app = electron.app
let shell = electron.shell
let dialog = electron.dialog

import querystring from 'querystring'

import urls from '../constants/urls'

import os from './os'

let self = {
  write_crash_log: (e) => {
    let crash_file = path.join(app.getPath('userData'), 'crash_logs', `${+new Date()}.txt`)

    let log = ''
    log += e.stack

    if (os.platform() === 'win32') {
      log = log.replace(/\n/g, '\r\n')
    }
    sf.writeFile(crash_file, log)

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
    shell.openExternal(`${urls.itchRepo}/issues/new?${query}`)
  },

  handle: (e) => {
    console.log(`Uncaught exception: ${e.stack}`)
    let res = self.write_crash_log(e)
    let log = res.log
    let crash_file = res.crash_file

    const t = require('i18next').getFixedT()

    let dialogOpts = {
      type: 'error',
      buttons: [
        t('prompt.crash_reporter.report_issue', {defaultValue: 'Report issue'}),
        t('prompt.crash_reporter.open_crash_log', {defaultValue: 'Open crash log'}),
        t('prompt.action.close', {defaultValue: 'Close'})
      ],
      message: t('prompt.crash_reporter.message', {defaultValue: 'The application has crashed'}),
      detail: t('prompt.crash_reporter.detail', {defaultValue: `A crash log was written to ${crash_file}`, location: crash_file})
    }

    let callback = (response) => {
      if (response === 0) {
        self.report_issue({log})
      } else if (response === 1) {
        shell.openItem(crash_file)
      }
    }

    // try to show error dialog
    // supplying defaultValues everywhere in case the i18n system hasn't loaded yet
    dialog.showMessageBox(dialogOpts, callback)
  },

  mount: () => {
    process.on('uncaughtException', (e) => {
      try {
        self.handle(e)
      } catch (e) {
        // well, we tried.
        console.log(`Error in crash-reporter\n${e.message || e}`)
      } finally {
        process.exit(1)
      }
    })
  }
}

export default self
