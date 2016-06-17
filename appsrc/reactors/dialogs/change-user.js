
import * as actions from '../../actions'

async function changeUser (store, action) {
  store.dispatch(actions.openModal({
    title: ['prompt.logout_title'],
    message: ['prompt.logout_confirm'],
    detail: ['prompt.logout_detail'],
    buttons: [
      {
        label: ['prompt.logout_action'],
        action: actions.logout(),
        icon: 'exit'
      },
      'cancel'
    ]
  }))
}

export default changeUser
