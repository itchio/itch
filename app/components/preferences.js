'use strict'

let r = require('r-dom')
let React = require('react')
let PropTypes = React.PropTypes
let Component = require('./component')
let db = require('../util/db')
// let mori = require('mori')

let AppActions = require('../actions/app-actions')

let InputRow = require('./forms').InputRow
let Icon = require('./misc').Icon

class PreferencesPage extends Component {
  render () {
    // let state = this.props.state

    return (
      r.div({className: 'preferences_page'}, [
        r.h1({className: 'preferences_form'}, 'Preferences'),
        r(PreferencesForm, {
          // page: mori.get(state, 'page'),
          // login_state: mori.get(state, 'login'),
          // setup_state: mori.get(state, 'setup')
        })
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
    // let page = this.props.page
    // let login_state = this.props.login_state
    // let setup_state = this.props.setup_state

    return (
      r.form({classSet: { form: true, onSubmit: this.handle_submit }}, [
        r(InputRow, { name: 'library_dir', type: 'text', ref: 'library_dir', defaultValue: db.library_dir, label: 'Library directory:', autofocus: true, disabled: false }),

        // Buttons.
        r.div({className: ''}, [
          r.div({
            className: 'button',
            onClick: () => {}
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
    // TODO
  }
}

PreferencesForm.propTypes = {
  state: PropTypes.any
}

module.exports = { PreferencesPage, PreferencesForm }
