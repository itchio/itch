
const r = require('r-dom')
const PropTypes = require('react').PropTypes
const ShallowComponent = require('./shallow-component')

const StatusBar = require('./status-bar')
const LibrarySidebar = require('./library-sidebar')
const LibraryContent = require('./library-content')

/**
 * The main state of the client - displaying the library
 */
class LibraryPage extends ShallowComponent {
  render () {
    let state = this.props.state

    return r.div({className: 'library_page'}, [
      r(StatusBar, {state}),
      r(LibrarySidebar, {state}),
      r(LibraryContent, {state})
    ])
  }
}

LibraryPage.propTypes = {
  state: PropTypes.any
}

module.exports = LibraryPage
