
let r = require('r-dom')
let PropTypes = require('react').PropTypes
let translate = require('react-i18next').translate
let ShallowComponent = require('./shallow-component')

let PreferencesForm = require('./preferences-form')

class PreferencesPage extends ShallowComponent {
  render () {
    let state = this.props.state

    return (
      r.div({className: 'preferences_page'}, [
        r.h1({className: 'preferences_form'}, 'Preferences'),
        r(PreferencesForm, {state})
      ])
    )
  }
}

PreferencesPage.propTypes = {
  state: PropTypes.any
}

module.exports = translate('preferences-page')(PreferencesPage)
