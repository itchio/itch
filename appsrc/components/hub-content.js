
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import * as actions from '../actions'

import HubBread from './hub-bread'
import HubMeat from './hub-meat'

let FIRST_EVER_RENDER = true

export class HubContent extends Component {
  render () {
    if (FIRST_EVER_RENDER) {
      FIRST_EVER_RENDER = false
      // ooh, dispatching actions from render method, bad!
      // come at me redux zealots I'm awaitin'
      this.props.firstUsefulPage()
    }

    if (!this.props.credentials) {
      return ''
    }

    return <div className='hub-content'>
      <HubBread/>
      <HubMeat/>
    </div>
  }
}

HubContent.propTypes = {
  t: PropTypes.func
}

const mapStateToProps = (state) => ({
  credentials: state.session.credentials
})
const mapDispatchToProps = (dispatch) => ({
  firstUsefulPage: () => dispatch(actions.firstUsefulPage())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubContent)
