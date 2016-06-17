
import {clipboard} from '../electron'

import * as actions from '../actions'

async function copyToClipboard (store, action) {
  clipboard.writeText(action.payload)
  store.dispatch(actions.statusMessage(['status.copied_to_clipboard']))
}

export default {copyToClipboard}
