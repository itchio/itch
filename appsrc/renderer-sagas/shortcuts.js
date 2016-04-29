
import Combokeys from 'combokeys-ftl'
import hookGlobalBind from 'combokeys-ftl/plugins/global-bind'

const combo = new Combokeys(document.documentElement)
hookGlobalBind(combo)

import {remote} from '../electron'

import createQueue from '../sagas/queue'

import os from '../util/os'
const osx = os.itchPlatform() === 'osx'

import {
  focusSearch,
  showNextTab,
  showPreviousTab,
  triggerMainAction,
  triggerBack,
  triggerLocation,
  focusNthTab,
  shortcutsVisibilityChanged
} from '../actions'

const queue = createQueue('shortcuts')

export default function * shortcutsSaga () {
  yield * queue.exhaust()
}

function openDevTools () {
  const win = remote.getCurrentWindow()
  win.webContents.openDevTools({detach: true})
}

// dev shortcuts
combo.bindGlobal(['shift+f12', 'ctrl+shift+c', 'command+shift+c'], openDevTools)
combo.bindGlobal(['shift+f5', 'shift+command+r'], () => window.location.reload())

// user shortcuts
combo.bindGlobal(['ctrl+f', 'command+f'], () => {
  queue.dispatch(focusSearch())
})

combo.bindGlobal(['ctrl+tab', 'ctrl+pagedown'], () => {
  queue.dispatch(showNextTab())
})

combo.bindGlobal(['ctrl+shift+tab', 'ctrl+pageup'], () => {
  queue.dispatch(showPreviousTab())
})

combo.bindGlobal(['ctrl+enter', 'command+enter'], () => {
  queue.dispatch(triggerMainAction())
})

combo.bindGlobal(['ctrl+l', 'command+l'], () => {
  queue.dispatch(triggerLocation())
})

combo.bindGlobal(['escape'], () => {
  queue.dispatch(triggerBack())
})

const prefix = osx ? 'command' : 'ctrl'

for (const i of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
  combo.bindGlobal([`${prefix}+${i}`], () => {
    queue.dispatch(focusNthTab(i))
  })

  combo.bindGlobal([prefix], () => {
    queue.dispatch(shortcutsVisibilityChanged({visible: true}))
  }, 'keydown')

  combo.bindGlobal([prefix], () => {
    queue.dispatch(shortcutsVisibilityChanged({visible: false}))
  }, 'keyup')
}
