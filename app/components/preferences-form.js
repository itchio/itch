
let r = require('r-dom')
let PropTypes = require('react').PropTypes
let translate = require('react-i18next').translate
let ShallowComponent = require('./shallow-component')

let AppActions = require('../actions/app-actions')

let SelectRow = require('./select-row')
let Icon = require('./icon')

// TODO: don't do that, go through app-store
let preferences = require('../util/preferences')

class PreferencesForm extends ShallowComponent {
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
    AppActions.save_preferences()
    AppActions.focus_panel('library')
  }
}

PreferencesForm.propTypes = {
  state: PropTypes.any
}

// XXX: can't use translate because it doesn't pass refs
module.exports = PreferencesForm
