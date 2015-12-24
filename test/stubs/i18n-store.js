
let i18n_state = {
  getFixedT: () => (x) => x
}
let I18nStore = {
  get_state: () => i18n_state,
  add_change_listener: () => null
}

module.exports = I18nStore
