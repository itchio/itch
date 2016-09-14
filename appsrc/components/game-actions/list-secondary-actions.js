
import invariant from 'invariant'
import {findWhere} from 'underline'

import * as actions from '../../actions'
import format, {DATE_FORMAT} from '../../util/format'

function browseAction (caveId) {
  return {
    label: ['grid.item.show_local_files'],
    icon: 'folder-open',
    type: 'secondary',
    action: actions.exploreCave({caveId})
  }
}

function purchaseAction (game, downloadKey, t) {
  invariant(typeof game === 'object', 'game is object')

  const donate = (game.minPrice === 0)
  const againSuffix = downloadKey ? '_again' : ''
  const hint = downloadKey ? format.date(downloadKey.createdAt, DATE_FORMAT, t.lang) : null

  if (donate) {
    return {
      label: ['grid.item.donate' + againSuffix],
      icon: 'heart-filled',
      action: actions.initiatePurchase({game}),
      classes: ['generous'],
      hint
    }
  } else {
    return {
      label: ['grid.item.buy_now' + againSuffix],
      icon: 'shopping_cart',
      action: actions.initiatePurchase({game}),
      classes: ['generous'],
      hint
    }
  }
}

function shareAction (game) {
  invariant(typeof game === 'object', 'game is object')

  return {
    label: ['grid.item.share'],
    icon: 'share',
    classes: ['generous'],
    action: actions.initiateShare({url: game.url})
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
    icon: 'uninstall',
    action: actions.requestCaveUninstall({caveId})
  }
}

export default function listSecondaryActions (props) {
  const {task, game, cave, mayDownload, canBeBought, downloadKey, action, t} = props
  let error = false

  const items = []

  if (cave) {
    if (task === 'error') {
      error = true

      items.push(retryAction(game.id))
      items.push(browseAction(cave.id))
      items.push(probeAction(cave.id))
    }

    // No errors
    if (canBeBought) {
      items.push(purchaseAction(game, downloadKey, t))
    }
    items.push(shareAction(game))

    items.push({
      type: 'separator'
    })

    if (action !== 'open') {
      items.push(browseAction(cave.id))
    }

    let version = ''
    if (cave.buildUserVersion) {
      version = `${cave.buildUserVersion}`
    } else if (cave.buildId) {
      version = `#${cave.buildId}`
    }

    const upload = cave.uploads::findWhere({id: cave.uploadId})
    if (upload && upload.displayName) {
      version += ` (${upload.displayName})`
    } else if (cave.channelName) {
      version += ` (${cave.channelName})`
    } else if (cave.uploadId) {
      version += ` #${cave.uploadId}`
    }

    const hint = `${format.date(cave.installedArchiveMtime, DATE_FORMAT, t.lang)}`

    items.push({
      type: 'info',
      icon: 'checkmark',
      label: ['grid.item.version', {version}],
      hint: hint,
      action: actions.copyToClipboard(`game ${game.id}, version ${version}`)
    })

    items.push({
      type: 'secondary',
      icon: 'repeat',
      label: ['grid.item.check_for_update'],
      action: actions.checkForGameUpdate({caveId: cave.id, noisy: true})
    })

    items.push(uninstallAction(cave.id))
  } else {
    // No cave
    const hasMinPrice = game.minPrice > 0
    const mainIsPurchase = !mayDownload && hasMinPrice && canBeBought

    if (!mainIsPurchase && canBeBought) {
      items.push(purchaseAction(game, downloadKey, t))
    }

    items.push(shareAction(game))

    items.push({
      type: 'separator'
    })
  }

  return {error, items}
}
