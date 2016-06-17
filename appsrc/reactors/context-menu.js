
import invariant from 'invariant'
import clone from 'clone'

import {BrowserWindow, Menu} from '../electron'
import localizer from '../localizer'

import {pathToId} from '../util/navigation'
import {getUserMarket} from './market'
import classificationActions from '../constants/classification-actions'

import * as actions from '../actions'

import {findWhere} from 'underline'

import mklog from '../util/log'
import {opts} from '../logger'
const log = mklog('reactors/context-menu')

async function openTabContextMenu (store, action) {
  invariant(typeof action.payload === 'object', 'opentabcontextmenu payload is an object')
  const {id} = action.payload
  invariant(typeof id === 'string', 'opentabcontextmenu path is string')

  const data = store.getState().session.navigation.tabData[id]
  if (!data) {
    log(opts, `Can't make context menu for non-transient tab ${id}`)
    return
  }

  const {path} = data
  const i18n = store.getState().i18n
  const t = localizer.getT(i18n.strings, i18n.lang)

  const template = []
  if (/^games/.test(path)) {
    const gameId = pathToId(path)
    const game = ((data || {}).games || {})[gameId]
    const action = classificationActions[game.classification] || 'launch'
    const cave = store.getState().globalMarket.cavesByGameId[gameId]

    if (cave) {
      template.push({
        label: t(`grid.item.${action}`),
        click: () => store.dispatch(actions.queueGame({game}))
      })
      template.push({
        label: t('grid.item.show_local_files'),
        click: () => store.dispatch(actions.exploreCave({caveId: cave.id}))
      })
      template.push({ type: 'separator' })
      template.push({
        label: t('grid.item.developer'),
        submenu: [
          {
            label: t('grid.item.check_for_update'),
            click: () => store.dispatch(actions.checkForGameUpdate({caveId: cave.id, noisy: true}))
          },
          {
            label: t('grid.item.open_debug_log'),
            click: () => store.dispatch(actions.probeCave({caveId: cave.id}))
          }
        ]
      })
      template.push({ type: 'separator' })
      template.push({
        label: t('prompt.uninstall.reinstall'),
        click: () => store.dispatch(actions.queueCaveReinstall({caveId: cave.id}))
      })
      template.push({
        label: t('prompt.uninstall.uninstall'),
        click: () => store.dispatch(actions.queueCaveUninstall({caveId: cave.id}))
      })
    } else {
      const downloadKeys = getUserMarket().getEntities('downloadKeys')
      const downloadKey = downloadKeys::findWhere({gameId: game.id})
      const hasMinPrice = game.minPrice > 0
      // FIXME game admins
      const meId = store.getState().session.credentials.me.id
      const canEdit = game.userId === meId
      const mayDownload = !!(downloadKey || !hasMinPrice || canEdit)

      if (mayDownload) {
        template.push({
          label: t('grid.item.install'),
          click: () => store.dispatch(actions.queueGame({game}))
        })
      } else {
        // TODO: use canBeBought
        template.push({
          label: t('grid.item.buy_now'),
          click: () => store.dispatch(actions.initiatePurchase({game}))
        })
      }
    }
  }

  if (template.length === 0) {
    // showing empty context menus would be NSANE!
    return
  }

  const menu = Menu.buildFromTemplate(clone(template))
  const mainWindowId = store.getState().ui.mainWindow.id
  const mainWindow = BrowserWindow.fromId(mainWindowId)
  menu.popup(mainWindow)
}

export default {openTabContextMenu}
