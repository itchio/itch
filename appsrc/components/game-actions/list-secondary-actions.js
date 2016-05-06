
import invariant from 'invariant'

import os from '../../util/os'
const platform = os.itchPlatform()

import * as actions from '../../actions'

function browseI18nKey () {
  let fallback = 'grid.item.open_in_file_explorer'
  switch (platform) {
    case 'osx': return ['grid.item.open_in_file_explorer_osx', fallback]
    case 'linux': return ['grid.item.open_in_file_explorer_linux', fallback]
    default: return fallback
  }
}

function browseAction (caveId) {
  return {
    label: [browseI18nKey()],
    icon: 'folder-open',
    action: actions.exploreCave({caveId})
  }
}

function purchaseAction (game) {
  invariant(typeof game === 'object', 'game is object')
  return {
    label: ['grid.item.purchase_or_donate'],
    icon: 'cart',
    action: actions.initiatePurchase({game})
  }
}

function retryAction (gameId) {
  return {
    label: ['grid.item.retry'],
    icon: 'repeat',
    action: actions.queueGame({gameId})
  }
}

function probeAction (caveId) {
  return {
    label: ['grid.item.probe'],
    icon: 'bug',
    action: actions.probeCave({caveId})
  }
}

function uninstallAction (caveId) {
  return {
    label: ['grid.item.uninstall'],
    icon: 'delete',
    action: actions.requestCaveUninstall({caveId})
  }
}

export default function listSecondaryActions (props) {
  const {task, game, cave, mayDownload, action} = props
  let error = false

  const items = []

  if (cave) {
    if (task === 'error') {
      error = true

      items.push(retryAction(game.id))
      items.push(browseAction(cave.id))
      items.push(probeAction(cave.id))
    }

    if (task === 'idle') {
      // No errors
      items.push(purchaseAction(game))

      if (action !== 'open') {
        items.push(browseAction(cave.id))
      }
    }

    items.push({
      type: 'separator'
    })

    let version = `${cave.uploadId}`
    if (cave.buildId) {
      version += `/${cave.buildId}`
    }
    version += ` @ ${cave.installedArchiveMtime}`

    items.push({
      type: 'info',
      icon: 'checkmark',
      label: ['grid.item.version', {version}],
      action: actions.copyToClipboard(`game ${game.id}, version ${version}`)
    })

    if (task === 'error' || task === 'idle') {
      items.push(uninstallAction(cave.id))
    }
  } else {
    // No cave
    const hasMinPrice = game.minPrice > 0
    const mainIsPurchase = !mayDownload && hasMinPrice

    // XXX should use API' can_be_bought but see
    // https://github.com/itchio/itch/issues/379
    if (!mainIsPurchase) {
      items.push(purchaseAction(game))
    }
  }

  return {error, items}
}
