
import invariant from 'invariant'

import * as actions from '../../actions'

import fetch from '../../util/fetch'

// ¯\_(ツ)_/¯
import {getGlobalMarket, getUserMarket} from '../../reactors/market'

async function requestCaveUninstall (store, action) {
  const {caveId} = action.payload
  const credentials = store.getState().session.credentials
  const globalMarket = getGlobalMarket()
  const userMarket = getUserMarket()

  const cave = globalMarket.getEntities('caves')[caveId]
  invariant(cave, 'cave to uninstall exists')

  const game = await fetch.gameLazily(userMarket, credentials, cave.gameId)
  invariant(game, 'was able to fetch game properly')
  const {title} = game

  store.dispatch(actions.openModal({
    title: '',
    message: ['prompt.uninstall.message', {title}],
    buttons: [
      {
        label: ['prompt.uninstall.uninstall'],
        action: actions.queueCaveUninstall({caveId}),
        icon: 'delete'
      },
      {
        label: ['prompt.uninstall.reinstall'],
        action: actions.queueCaveReinstall({caveId}),
        icon: 'repeat'
      },
      'cancel'
    ]
  }))
}

export default requestCaveUninstall
