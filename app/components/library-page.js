
let r = require('r-dom')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let StatusBar = require('./status-bar')
let ReactTooltip = require('react-tooltip')
let LibrarySidebar = require('./library-sidebar')
let LibraryContent = require('./library-content')

/**
 * The main state of the client - displaying the library
 */
class LibraryPage extends ShallowComponent {
  render () {
    let state = this.props.state

    return r.div({className: 'library_page'}, [
      r(ReactTooltip, {
        delayShow: 500,
        place: 'top',
        effect: 'float',
        type: 'dark',
        offset: "{ 'top': 10, 'left': 10 }",
        border: true
      }),
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
