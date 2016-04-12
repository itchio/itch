
import {connect} from './connect'
import React, {Component, PropTypes} from 'react'

import * as actions from '../actions'

class HubSidebarHandle extends Component {

  constructor () {
    super()
    this.handleMouseDown = ::this.handleMouseDown
    this.handleMouseUp = ::this.handleMouseUp
    this.handleMouseMove = ::this.handleMouseMove
    this.state = { isResizing: false }
  }

  render () {
    return <div className='hub-sidebar-handle' onMouseDown={this.handleMouseDown}/>
  }

  componentDidMount () {
    window.addEventListener('mouseup', this.handleMouseUp)
    window.addEventListener('mousemove', this.handleMouseMove)
  }

  componentWillUnmount () {
    window.removeEventListener('mouseup', this.handleMouseUp)
    window.removeEventListener('mousemove', this.handleMouseMove)
  }

  handleMouseDown () {
    this.setState({ isResizing: true })
  }

  handleMouseUp () {
    this.setState({ isResizing: false })
  }

  handleMouseMove (e) {
    if (!this.state.isResizing) return
    e.preventDefault()

    const {updatePreferences} = this.props
    const width = Math.max(150, Math.min(e.clientX, 500))

    updatePreferences({
      sidebarWidth: width
    })
  }
}

HubSidebarHandle.propTypes = {
  updatePreferences: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({})
const mapDispatchToProps = (dispatch) => ({
  updatePreferences: (record) => dispatch(actions.updatePreferences(record))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubSidebarHandle)
