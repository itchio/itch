
import React, {Component, PropTypes} from 'react'
import invariant from 'invariant'

import {connect} from './connect'

import * as actions from '../actions'

export class CollectionHubItem extends Component {
  render () {
    const {collection} = this.props
    const {navigateToCollection} = this.props
    const {title} = collection

    return <div className='hub-item collection-hub-item'>
      <section className='undercover' onClick={() => navigateToCollection(collection)}>
        <section className='title'>
          {title}
        </section>
      </section>
    </div>
  }
}

CollectionHubItem.propTypes = {
  game: PropTypes.shape({
    title: PropTypes.string,
    coverUrl: PropTypes.string
  }),

  navigateToCollection: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({})

const mapDispatchToProps = (dispatch) => ({
  navigateToCollection: (collection) => {
    invariant(typeof collection === 'object', 'collection is an object')
    dispatch(actions.navigateToCollection(collection))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CollectionHubItem)
