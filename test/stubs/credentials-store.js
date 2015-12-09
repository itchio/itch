'use nodent';'use strict'

import api from './api'

export default {
  get_current_user: () => api.user,
  get_me: () => null,
  add_change_listener: () => null,
  remove_change_listener: () => null,
  '@noCallThru': true
}
