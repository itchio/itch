
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import HubBread from './hub-bread'
import HubMeat from './hub-meat'

export class HubContent extends Component {
  render () {
    return <div className='hub-content'>
      <HubBread/>
      <HubMeat/>
    </div>
  }
}

HubContent.propTypes = {
  t: PropTypes.func
}

const mapStateToProps = (state) => ({})
const mapDispatchToProps = () => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubContent)
