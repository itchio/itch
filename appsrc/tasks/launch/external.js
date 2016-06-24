
import invariant from 'invariant'

import store from '../../store'
import * as actions from '../../actions'

export default async function launch (out, opts) {
  const {cave, manifestAction} = opts
  invariant(cave, 'launch/shell has cave')
  invariant(manifestAction, 'launch/shell has manifestAction')
  invariant(typeof manifestAction.path === 'string', 'launch/shell has manifestAction path')

  store.dispatch(actions.navigate(`url/${manifestAction.path}`))
}
