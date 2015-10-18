
import api from './api'

export default {
  get_current_user: () => api.user,
  add_change_listener: () => null,
  '@noCallThru': true
}
