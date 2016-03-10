
import {connect} from 'react-redux'
import React, {Component} from 'react'

export class HubPage extends Component {
  render () {
    return <div>'Hubbing it up'</div>
  }
}

const mapStateToProps = (state) => {}
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubPage)
