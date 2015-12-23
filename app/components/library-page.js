
let r = require('r-dom')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let translate = require('react-i18next').translate
let ShallowComponent = require('./shallow-component')

let StatusBar = require('./status-bar')
let LibrarySidebar = require('./library-sidebar')
let LibraryContent = require('./library-content')

/**
 * The main state of the client - displaying the library
 */
class LibraryPage extends ShallowComponent {
  render () {
    let state = this.props.state

    return r.div({className: 'library_page'}, [
      r(StatusBar, {update: mori.get(state, 'update')}),
      r(LibrarySidebar, {state: mori.get(state, 'library')}),
      r(LibraryContent, {state})
    ])
  }
}

LibraryPage.propTypes = {
  state: PropTypes.any
}

module.exports = translate('library-page')(LibraryPage)
