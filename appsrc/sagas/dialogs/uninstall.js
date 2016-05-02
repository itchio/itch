
import createQueue from '../queue'
import invariant from 'invariant'

import {takeEvery} from '../effects'
import {put, call, select} from 'redux-saga/effects'

import {openModal, queueCaveUninstall, queueCaveReinstall} from '../../actions'
import {REQUEST_CAVE_UNINSTALL} from '../../constants/action-types'

import fetch from '../../util/fetch'

// :(
import {getGlobalMarket, getUserMarket} from '../../sagas/market'

const queue = createQueue('change-user')

export function * _requestCaveUninstall (action) {
  const {caveId} = action.payload
  const credentials = yield select((state) => state.session.credentials)
  const globalMarket = getGlobalMarket()
  const userMarket = getUserMarket()

  const cave = globalMarket.getEntities('caves')[caveId]
  invariant(cave, 'cave to uninstall exists')

  const game = yield call(fetch.gameLazily, userMarket, credentials, cave.gameId)
  invariant(game, 'was able to fetch game properly')
  const {title} = game

  yield put(openModal({
    title: '',
    message: ['prompt.uninstall.message', {title}],
    buttons: [
      {
        label: ['prompt.uninstall.uninstall'],
        action: queueCaveUninstall({caveId}),
        icon: 'delete'
      },
      {
        label: ['prompt.uninstall.reinstall'],
        action: queueCaveReinstall({caveId}),
        icon: 'repeat'
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
