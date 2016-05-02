
import {takeEvery} from '../sagas/effects'
import {call} from 'redux-saga/effects'

import {NOTIFY_HTML5} from '../constants/action-types'

import path from 'path'
import createQueue from '../sagas/queue'

const queue = createQueue('notifications')

export function * _notifyHtml5 (action) {
  const {title, opts, onClick} = action.payload
  if (opts.icon) {
    opts.icon = path.resolve(path.join(__dirname, '..', opts.icon))
  }
  const notification = new Notification(title, opts) // eslint-disable-line

  if (onClick) {
    notification.onClick = () => {
      queue.dispatch(onClick)
    }
  }
}

export default function * notificationsSaga () {
  yield [
    takeEvery(NOTIFY_HTML5, _notifyHtml5),
    call(queue.exhaust)
  ]
}
