
const api = require('./api')

module.exports = {
  get_current_user: () => api.user,
  get_me: () => ({id: 123}),
  add_change_listener: () => null,
  remove_change_listener: () => null,
  '@noCallThru': true
}
