
import {takeEvery, delay} from '../sagas/effects'

import {each} from 'underline'

import {
  ENCOURAGE_GENEROSITY
} from '../constants/action-types'

const GENEROSITY_TIMEOUT = 1000

function * _encourageGenerosity (action) {
  const {level} = action.payload

  if (level === 'discreet') {
    yield delay(500)

    const items = document.querySelectorAll('.generous')
    const className = 'shake'
    items::each((item) => {
      item.classList.add(className)
    })

    yield delay(GENEROSITY_TIMEOUT)
    items::each((item) => {
      item.classList.remove(className)
    })
  } else {
    console.log(`Don't know how to encourage generosity @ level ${level}`)
  }
}

export default function * focusSearchSaga () {
  yield [
    takeEvery(ENCOURAGE_GENEROSITY, _encourageGenerosity)
  ]
}
