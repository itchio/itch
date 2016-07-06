
import querystring from 'querystring'

import * as actions from '../actions'

async function initiateShare (store, action) {
  const {url} = action.payload
  const query = querystring.encode({url})
  store.dispatch(actions.openUrl(`https://www.addtoany.com/share?${query}`))
}

export default {initiateShare}
