
import createQueue from '../queue'

import {takeEvery} from 'redux-saga'
import {put, call} from 'redux-saga/effects'

import {openModal, queueCaveUninstall, queueCaveReinstall} from '../../actions'
import {REQUEST_CAVE_UNINSTALL} from '../../constants/action-types'

import fetch from '../../util/fetch'

// :(
import {getGlobalMarket, getUserMarket} from '../../sagas/market'

const queue = createQueue('change-user')

export function * _requestCaveUninstall (action) {
  const {caveId} = action.payload
  const store = require('../../store').default
  const {credentials} = store.getState().session.credentials
  const globalMarket = getGlobalMarket()
  const userMarket = getUserMarket()

  const cave = globalMarket.getEntities('caves')[caveId]

  const game = fetch.gameLazily(userMarket, credentials, cave.gameId)
  const {title} = game

  yield put(openModal({
    title: ['prompt.uninstall.message', {title}],
    message: ['prompt.uninstall.message', {title}],
    buttons: [
      {
        label: ['prompt.uninstall.uninstall'],
        action: queueCaveUninstall({caveId}),
        icon: 'exit'
      },
      {
        label: ['prompt.uninstall.reinstall'],
        action: queueCaveReinstall({caveId}),
        icon: 'exit'
      },
      'cancel'
    ]
  }))
}

export default function * changeUserSaga () {
  yield [
    takeEvery(REQUEST_CAVE_UNINSTALL, _requestCaveUninstall),
    call(queue.exhaust)
  ]
}
