
let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let urls = require('../constants/urls')
let market = require('../util/market')
let Store = require('./store')
let I18nStore = require('./i18n-store')

let electron = require('electron')

let PolicyStore = Object.assign(new Store('policy-store'), {})

async function show_packaging_policy (payload) {
  let i18n = I18nStore.get_state()
  let format = payload.format

  let game_id = payload.game_id
  let game = market.get_entities('games')[game_id]

  let buttons = [
    i18n.t('prompt.action.ok'),
    i18n.t(`prompt.packaging_policy.learn_more`),
    i18n.t(`prompt.packaging_policy.open_web_page`, {title: game.title})
  ]

  let dialog_opts = {
    type: 'error',
    buttons,
    title: i18n.t(`prompt.${format}_policy.title`),
    message: i18n.t(`prompt.${format}_policy.message`, {title: game.title}),
    detail: i18n.t(`prompt.${format}_policy.detail`)
  }

  let callback = (response) => {
    // not much to do anyway.
    if (response === 1) {
      electron.shell.openExternal(urls[`${format}_policy`])
    } else if (response === 2) {
      electron.shell.openExternal(game.url)
    }
  }
  electron.dialog.showMessageBox(dialog_opts, callback)
}

AppDispatcher.register('policy-store', Store.action_listeners(on => {
  on(AppConstants.SHOW_PACKAGING_POLICY, show_packaging_policy)
}))

module.exports = PolicyStore
