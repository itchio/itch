
import invariant from 'invariant'

import urls from '../constants/urls'

import {getUserMarket} from './market'
import fetch from '../util/fetch'

import localizer from '../localizer'
import {shell, dialog} from '../electron'

async function showPackagingPolicy (store, action) {
  const {format, gameId} = action.payload
  invariant(typeof format === 'string', 'showPackagingPolicy has string format')
  invariant(typeof gameId === 'number', 'showPackagingPolicy has game id')

  const i18n = store.getState().i18n
  const t = localizer.getT(i18n.strings, i18n.lang)

  const credentials = store.getState().session.credentials
  const market = getUserMarket()

  const game = await fetch.gameLazily(market, credentials, gameId)
  if (!game) {
    throw new Error(`unknown game id ${gameId}, can't show policy`)
  }

  const buttons = [
    t('prompt.action.ok'),
    t('prompt.packaging_policy.learn_more'),
    t('prompt.packaging_policy.open_web_page', {title: game.title})
  ]

  const dialogOpts = {
    type: 'error',
    buttons,
    title: t(`prompt.${format}_policy.title`),
    message: t(`prompt.${format}_policy.message`, {title: game.title}),
    detail: t(`prompt.${format}_policy.detail`)
  }

  const callback = (response) => {
    // not much to do anyway.
    if (response === 1) {
      shell.openExternal(urls[`${format}Policy`])
    } else if (response === 2) {
      shell.openExternal(game.url)
    }
  }
  dialog.showMessageBox(dialogOpts, callback)
}

export default {showPackagingPolicy}
