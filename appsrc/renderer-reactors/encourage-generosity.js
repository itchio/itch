
import {each} from 'underline'

import delay from '../reactors/delay'

const GENEROSITY_PREWARM = 500
const GENEROSITY_TIMEOUT = 1000

import mklog from '../util/log'
const log = mklog('renderer-reactors/generosity')
import {opts} from '../logger'

async function encourageGenerosity (store, action) {
  const {level} = action.payload

  if (level === 'discreet') {
    await delay(GENEROSITY_PREWARM)

    const items = document.querySelectorAll('.generous')
    const className = 'shake'
    items::each((item) => {
      item.classList.add(className)
    })

    await delay(GENEROSITY_TIMEOUT)
    items::each((item) => {
      item.classList.remove(className)
    })
  } else {
    log(opts, `Don't know how to encourage generosity @ level ${level}`)
  }
}

export default {encourageGenerosity}
