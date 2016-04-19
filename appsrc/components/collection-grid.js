
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

export class CollectionGrid extends Component {
  render () {
    const {collections} = this.props

    return <div>
      {collections.length} collections
    </div>
  }
}

CollectionGrid.propTypes = {
  // specified
  collections: PropTypes.any.isRequired
}

const mapStateToProps = () => ({})
const mapDispatchToProps = () => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CollectionGrid)
