
let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let urls = require('../constants/urls')
let Store = require('./store')
let I18nStore = require('./i18n-store')

let electron = require('electron')

let RarStore = Object.assign(new Store('rar-store'), {})

async function show_rar_policy () {
  let i18n = I18nStore.get_state()

  let buttons = [
    i18n.t('prompt.action.ok'),
    i18n.t('prompt.rar_policy.learn_more')
  ]

  let dialog_opts = {
    type: 'error',
    buttons,
    title: i18n.t('prompt.rar_policy.title'),
    message: i18n.t('prompt.rar_policy.message'),
    detail: i18n.t('prompt.rar_policy.detail')
  }

  let callback = (response) => {
    // not much to do anyway.
    if (response === 1) {
      electron.shell.openExternal(urls.rar_policy)
    }
  }
  electron.dialog.showMessageBox(dialog_opts, callback)
}

AppDispatcher.register('rar-store', Store.action_listeners(on => {
  on(AppConstants.SHOW_RAR_POLICY, show_rar_policy)
}))

module.exports = RarStore
