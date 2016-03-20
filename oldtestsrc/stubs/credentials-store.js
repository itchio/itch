
import test from 'zopf'
import api from './api'

module.exports = test.module({
  get_current_user: () => api.user,
  get_me: () => ({id: 123}),
  add_change_listener: () => null,
  remove_change_listener: () => null
})
