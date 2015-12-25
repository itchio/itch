
let r = require('r-dom')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let AppActions = require('../actions/app-actions')

let SelectRow = require('./select-row')
let Icon = require('./icon')

let language_codes = require('../constants/language-codes')

class PreferencesForm extends ShallowComponent {
  constructor () {
    super()
    this.on_language_change = this.on_language_change.bind(this)
  }

  render () {
    let t = this.t
    let state = this.props.state
    let language = mori.getIn(state, ['preferences', 'language'])

    return (
      r.div({className: 'preferences_panel'}, [
        r.span({className: 'icon icon-cog preferences_background'}),
        r.h2({}, t('menu.file.preferences')),

        r.form({className: `form preferences_form`}, [
          r(SelectRow, {
            on_change: this.on_language_change,
            options: language_codes,
            value: language,
            label: t('preferences.language')
          }),
          r.div({className: 'get_involved'}, [
            r.a({href: 'http://weblate.itch.ovh'}, [
              r(Icon, {icon: 'earth'}),
              t('preferences.language.get_involved', {name: 'itch'})
            ])
          ]),
          r.p({}, t('preferences.install_locations')),
          r.table({className: 'install_locations'}, [
            r.tr({}, [
              r.th({}, t('preferences.install_location.name')),
              r.th({}, t('preferences.install_location.path')),
              r.th({}, t('preferences.install_location.size')),
              r.th({}, ''),
              r.th({}, '')
            ]),
            r.tr({}, [
              r.td({}, 'main'),
              r.td({}, '~/Application Support/itch/users/230948'),
              r.td({}, '2348 Mb'),
              r.td({}, r(Icon, {icon: 'folder-open'})),
              r.td({}, r(Icon, {icon: 'delete'}))
            ])
          ])
        ])
      ])
    )
  }

  on_language_change (language) {
    AppActions.preferences_set_language(language)
  }
}

PreferencesForm.propTypes = {
  state: PropTypes.any
}

module.exports = PreferencesForm
