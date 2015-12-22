'use strict'

let r = require('r-dom')
let React = require('react')
let PropTypes = React.PropTypes

let Component = require('./component')
let SelectRow = require('./forms').SelectRow
let Icon = require('./misc').Icon

let preferences = require('../util/preferences')
let AppActions = require('../actions/app-actions')

class PreferencesPage extends Component {
  render () {
    return (
      r.div({className: 'preferences_page'}, [
        r.h1({className: 'preferences_form'}, 'Preferences'),
        r(PreferencesForm, {})
      ])
    )
  }
}

PreferencesPage.propTypes = {
  state: PropTypes.any
}

class PreferencesForm extends Component {
  constructor () {
    super()
    this.handle_submit = this.handle_submit.bind(this)
  }

  render () {
    let language = preferences.read('language') || 'en'

    return (
      r.form({classSet: { form: true, onSubmit: this.handle_submit }}, [
        r(SelectRow, { ref: 'language', options: [{ value: 'en', label: 'English' }, { value: 'es', label: 'Español' }], value: language, label: 'Language:' }),

        // Buttons.
        r.div({className: ''}, [
          r.div({
            className: 'button',
            onClick: this.handle_submit
          }, [
            r.span({}, [
              r(Icon, {icon: 'install'}), // TODO: Integrate a "save" icon.
              ' Save'
            ])
          ]),
          r.div({
            className: 'button',
            onClick: () => { AppActions.focus_panel('library') }
          }, [ // TODO: Should be like "secondary" style instead of main color (primary).
            r.span({}, [
              r(Icon, {icon: 'uninstall'}), // TODO: Integrate a "cancel" icon.
              ' Cancel'
            ])
          ])
        ])
      ])
    )
  }

  handle_submit (event) {
    event.preventDefault()

    // Save JSON with preferences.
    preferences.save('language', this.refs.language.value())

    // Go back.
    AppActions.focus_panel('library')
  }
}

PreferencesForm.propTypes = {
  state: PropTypes.any
}

module.exports = { PreferencesPage, PreferencesForm }
