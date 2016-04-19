
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import {map} from 'underline'
import * as actions from '../actions'

export class CollectionGrid extends Component {
  render () {
    const {collections} = this.props
    const {navigate} = this.props

    return <div>
      {collections::map((collection) => {
        const {id, title} = collection

        return <div key={id} className='collection-hub-item' onClick={() => navigate(`collections/${id}`)}>
          {title} ({(collection.gameIds || {}).length})
        </div>
      })}
    </div>
  }
}

CollectionGrid.propTypes = {
  // specified
  collections: PropTypes.any.isRequired,

  // derived
  navigate: PropTypes.any.isRequired
}

const mapStateToProps = () => ({})
const mapDispatchToProps = (dispatch) => ({
  navigate: (a, b) => dispatch(actions.navigate(a, b))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CollectionGrid)
