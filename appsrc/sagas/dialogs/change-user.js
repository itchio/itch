
import createQueue from '../queue'

import {takeEvery} from 'redux-saga'
import {put, call} from 'redux-saga/effects'

import {openModal, logout} from '../../actions'
import {CHANGE_USER} from '../../constants/action-types'

const queue = createQueue('change-user')

export function * _changeUser () {
  yield put(openModal({
    title: ['prompt.logout_title'],
    message: ['prompt.logout_confirm'],
    detail: ['prompt.logout_detail'],
    buttons: [
      {
        label: ['prompt.logout_action'],
        action: logout(),
        icon: 'moon'
      },
      'cancel'
    ]
  }))
}

export default function * changeUserSaga () {
  yield [
    takeEvery(CHANGE_USER, _changeUser),
    call(queue.exhaust)
  ]
}
