
import test from 'zopf'
const t = (x) => x

const i18n_state = {
  getFixedT: () => t,
  t
}

const I18nStore = {
  get_state: () => i18n_state,
  add_change_listener: () => null
}

module.exports = test.module(I18nStore)
