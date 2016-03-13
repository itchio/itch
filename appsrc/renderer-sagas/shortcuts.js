
import Combokeys from 'combokeys'
import {remote} from '../electron'

import createQueue from '../sagas/queue'

import {focusSearch} from '../actions'

const combo = new Combokeys(document.documentElement)

const queue = createQueue('shortcuts')

export default function * shortcutsSaga () {
  yield* queue.exhaust()
}

function openDevTools () {
  const win = remote.getCurrentWindow()
  win.webContents.openDevTools({detach: true})
}

// dev shortcuts
combo.bind(['shift+f12', 'ctrl+shift+c'], openDevTools)
combo.bind(['shift+f5', 'shift+command+r'], () => window.location.reload())

// user shortcuts
combo.bind(['ctrl+f', 'command+f'], () => queue.dispatch(focusSearch()))
