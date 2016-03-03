
import r from 'r-dom'
import {PropTypes} from 'react'
import ShallowComponent from './shallow-component'

import StatusBar from './status-bar'
import LibrarySidebar from './library-sidebar'
import LibraryContent from './library-content'

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

export default LibraryPage
