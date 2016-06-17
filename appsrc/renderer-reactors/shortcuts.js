
import Combokeys from 'combokeys-ftl'
import hookGlobalBind from 'combokeys-ftl/plugins/global-bind'

const combo = new Combokeys(document.documentElement)
hookGlobalBind(combo)

import {remote} from 'electron'

import os from '../util/os'
const osx = os.itchPlatform() === 'osx'

import * as actions from '../actions'

function openDevTools () {
  const win = remote.getCurrentWindow()
  win.webContents.openDevTools({detach: true})
}

async function mount (store, action) {
  // dev shortcuts
  combo.bindGlobal(['shift+f12', 'ctrl+shift+c', 'command+shift+c'], openDevTools)
  combo.bindGlobal(['shift+f5', 'shift+command+r'], () => window.location.reload())

  // user shortcuts
  combo.bindGlobal(['ctrl+f', 'command+f'], () => {
    store.dispatch(actions.focusSearch())
  })

  combo.bindGlobal(['ctrl+tab', 'ctrl+pagedown'], () => {
    store.dispatch(actions.showNextTab())
  })

  combo.bindGlobal(['ctrl+shift+tab', 'ctrl+pageup'], () => {
    store.dispatch(actions.showPreviousTab())
  })

  combo.bindGlobal(['enter'], () => {
    store.dispatch(actions.triggerOk())
  })

  combo.bindGlobal(['ctrl+enter', 'command+enter'], () => {
    store.dispatch(actions.triggerMainAction())
  })

  combo.bindGlobal(['ctrl+l', 'command+l'], () => {
    store.dispatch(actions.triggerLocation())
  })

  combo.bindGlobal(['escape'], () => {
    store.dispatch(actions.triggerBack())
  })

  const prefix = osx ? 'command' : 'ctrl'

  for (const i of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    combo.bindGlobal([`${prefix}+${i}`], () => {
      store.dispatch(actions.focusNthTab(i))
    })
  }

  combo.bindGlobal([`${prefix}+t`], () => {
    store.dispatch(actions.newTab())
  })
}

export default {mount}
