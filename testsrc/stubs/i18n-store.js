
let t = (x) => x

let i18n_state = {
  getFixedT: () => t,
  t
}
let I18nStore = {
  get_state: () => i18n_state,
  add_change_listener: () => null
}

module.exports = I18nStore
