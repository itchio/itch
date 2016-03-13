
import {dialog} from '../../electron'
import {getT} from '../../localizer'
import createQueue from '../queue'

import {takeEvery} from 'redux-saga'
import {call, select} from 'redux-saga/effects'

import {logout} from '../../actions'
import {CHANGE_USER} from '../../constants/action-types'

const queue = createQueue('change-user')

export function * _changeUser () {
  const {strings, lang} = yield select((state) => state.i18n)
  const t = getT(strings, lang)

  let buttons = [
    t('prompt.action.ok'),
    t('prompt.action.cancel')
  ]
  let dialogOpts = {
    cancelId: 1,
    type: 'question',
    buttons,
    message: t('prompt.logout_confirm')
  }

  let callback = (response) => {
    if (response === 0) {
      queue.dispatch(logout())
    } else if (response === 1) {
      // phew
    }
  }
  dialog.showMessageBox(dialogOpts, callback)
}

export default function * changeUserSaga () {
  yield [
    takeEvery(CHANGE_USER, _changeUser),
    call(queue.exhaust)
  ]
}
