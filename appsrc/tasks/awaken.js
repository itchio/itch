
import {Transition} from './errors'
import CaveStore from '../stores/cave-store'

const self = {}

self.start = async function (opts) {
  let id = opts.id

  let cave = CaveStore.find(id)

  if (cave.launchable) {
    throw new Transition({ to: 'check-for-update', reason: 'awakening' })
  } else {
    throw new Transition({ to: 'find-upload', reason: 'not-installed' })
  }
}

export default self
