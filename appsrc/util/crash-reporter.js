
// TODO: reduce dependency on electron to allow easier testing
import {app, shell, dialog} from '../electron'

import path from 'path'
import querystring from 'querystring'

import platformData from '../constants/platform-data'
import urls from '../constants/urls'

import {findWhere} from 'underline'

import os from './os'
import sf from './sf'

let self = {
  catching: false,

  sampleCrash: () => {
    setTimeout(() => {
      throw new Error('hello this is crash reporter with a sample crash.')
    }, 10)
  },

  writeCrashLog: async (e) => {
    const crashFile = path.join(app.getPath('userData'), 'crash_logs', `${+new Date()}.txt`)

    let log = ''
    log += (e.stack || e.message || e)

    if (os.platform() === 'win32') {
      log = log.replace(/\n/g, '\r\n')
    }
    await sf.writeFile(crashFile, log)

    return {log, crashFile}
  },

  reportIssue: (opts) => {
    if (typeof opts === 'undefined') {
      opts = {}
    }

    const log = opts.log
    let body = opts.body || ''
    let type = opts.type || 'Issue'
    const repo = opts.repo || urls.itchRepo
    const before = opts.before || ''

    if (typeof log !== 'undefined') {
      type = 'Crash report'
      body =
`Crash log:

\`\`\`
${log}
\`\`\`
`
    }

    const platformEmoji = platformData::findWhere({platform: os.itchPlatform()}).emoji
    const query = querystring.stringify({
      title: `${platformEmoji} ${type} v${app.getVersion()}`,
      body: (before + body)
    })
    shell.openExternal(`${repo}/issues/new?${query}`)
  },

  handle: async function (type, e) {
    if (self.catching) {
      console.log(`While catching: ${e.stack || e}`)
      return
    }
    self.catching = true

    console.log(`${type}: ${e.stack}`)
    let res = await self.writeCrashLog(e)
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
        } else if (response === 2) {
          process.exit(1)
        }
      }

      // try to show error dialog
      // supplying defaultValues everywhere in case the i18n system hasn't loaded yet
      dialog.showMessageBox(dialogOpts, callback)
    })

    self.catching = false
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
