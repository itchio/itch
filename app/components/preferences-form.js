
let r = require('r-dom')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let translate = require('react-i18next').translate
let ShallowComponent = require('./shallow-component')

let AppActions = require('../actions/app-actions')

let SelectRow = require('./select-row')
let Icon = require('./icon')

// TODO: move to constants
let lang_opts = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' }
]

class PreferencesForm extends ShallowComponent {
  constructor () {
    super()
    this.on_language_change = this.on_language_change.bind(this)
  }

  render () {
    let state = this.props.state
    let language = mori.getIn(state, ['preferences', 'language'])

    return (
      r.div({className: 'preferences_panel'}, [
        r.h2({}, 'Preferences'),

        r.form({className: `form preferences_form`}, [
          r(SelectRow, {
            on_change: this.on_language_change,
            options: lang_opts,
            value: language,
            label: 'Language'
          })
        ]),

        r.span({className: 'icon icon-cog preferences_background'})
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

module.exports = translate('preferences-form')(PreferencesForm)
