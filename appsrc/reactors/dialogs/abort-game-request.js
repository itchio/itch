
import invariant from 'invariant'

import * as actions from '../../actions'

async function abortGameRequest (store, action) {
  const {game} = action.payload
  invariant(typeof game === 'object', 'abort game request needs a game')

  store.dispatch(actions.openModal({
    title: ['prompt.abort_game.title'],
    message: ['prompt.abort_game.message', {title: game.title}],
    buttons: [
      {
        label: ['prompt.action.force_close'],
        action: actions.abortGame({gameId: game.id}),
        icon: 'cross'
      },
      'cancel'
    ]
  }))
}

export default abortGameRequest
