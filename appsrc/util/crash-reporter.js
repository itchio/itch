
// TODO: reduce dependency on electron to allow easier testing
import {app, shell, dialog} from '../electron'

import path from 'path'
import querystring from 'querystring'

import urls from '../constants/urls'

import os from './os'
import sf from './sf'

let self = {
  writeCrashLog: (e) => {
    const crashFile = path.join(app.getPath('userData'), 'crash_logs', `${+new Date()}.txt`)

    let log = ''
    log += e.stack

    if (os.platform() === 'win32') {
      log = log.replace(/\n/g, '\r\n')
    }
    sf.writeFile(crashFile, log)

    return {log, crashFile}
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

  handle: async function (type, e) {
    console.log(`${type}: ${e.stack}`)
    let res = self.writeCrashLog(e)
    let log = res.log
    let crashFile = res.crashFile

    // TODO: something better
    const t = require('../localizer').getT({}, 'en')

    let dialogOpts = {
      type: 'error',
      buttons: [
        t('prompt.crash_reporter.report_issue', {defaultValue: 'Report issue'}),
        t('prompt.crash_reporter.open_crash_log', {defaultValue: 'Open crash log'}),
        t('prompt.action.close', {defaultValue: 'Close'})
      ],
      message: t('prompt.crash_reporter.message', {defaultValue: 'The application has crashed'}),
      detail: t('prompt.crash_reporter.detail', {defaultValue: `A crash log was written to ${crashFile}`, location: crashFile})
    }

    await new Promise(async function (resolve, reject) {
      let callback = (response) => {
        if (response === 0) {
          self.reportIssue({log})
        } else if (response === 1) {
          shell.openItem(crashFile)
        }
      }

      // try to show error dialog
      // supplying defaultValues everywhere in case the i18n system hasn't loaded yet
      dialog.showMessageBox(dialogOpts, callback)
    })
  },

  mount: () => {
    console.log('Mounting crash reporter')
    const makeHandler = (type) => {
      return async function (e) {
        try {
          await self.handle(type, e)
        } catch (e) {
          // well, we tried.
          console.log(`Error in crash-reporter (${type})\n${e.message || e}`)
        } finally {
          if (type === 'uncaughtException') {
            process.exit(1)
          }
        }
      }
    }
    process.on('uncaughtException', makeHandler('Uncaught exception'))
    process.on('unhandledRejection', makeHandler('Unhandled rejection'))
  }
}

export default self
