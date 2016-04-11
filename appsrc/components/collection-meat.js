
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

export class CollectionMeat extends Component {
  render () {
    const {collectionId} = this.props

    return <span>Collection {collectionId}</span>
  }
}

CollectionMeat.propTypes = {
  collectionId: PropTypes.number
}

const mapStateToProps = (state) => ({})
const mapDispatchToProps = (state) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CollectionMeat)
