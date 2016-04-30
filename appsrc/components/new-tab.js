
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

export class NewTab extends Component {
  render () {
    return <div className='new-tab-meat'>
      {'It\'s a new taaaaab'}
    </div>
  }
}

NewTab.propTypes = {
  t: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NewTab)
