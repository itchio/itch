
import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import urls from '../constants/urls'
import market from '../util/market'
import fetch from '../util/fetch'
import Store from './store'
import I18nStore from './i18n-store'

import electron from 'electron'

const PolicyStore = Object.assign(new Store('policy-store'), {})

async function show_packaging_policy (payload) {
  pre: { // eslint-disable-line
    typeof payload === 'object'
    typeof payload.format === 'string'
    typeof payload.game_id === 'number'
  }

  const i18n = I18nStore.get_state()
  const format = payload.format

  const game = await fetch.game_lazily(market, payload.game_id)
  if (!game) {
    throw new Error(`unknown game id ${payload.game_id}, can't show policy`)
  }

  console.log(`policy store, got game: ${JSON.stringify(game, null, 2)}`)

  const buttons = [
    i18n.t('prompt.action.ok'),
    i18n.t(`prompt.packaging_policy.learn_more`),
    i18n.t(`prompt.packaging_policy.open_web_page`, {title: game.title})
  ]

  const dialog_opts = {
    type: 'error',
    buttons,
    title: i18n.t(`prompt.${format}_policy.title`),
    message: i18n.t(`prompt.${format}_policy.message`, {title: game.title}),
    detail: i18n.t(`prompt.${format}_policy.detail`)
  }

  const callback = (response) => {
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

export default PolicyStore
