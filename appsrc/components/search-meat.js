
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

export class SearchMeat extends Component {
  render () {
    const {query} = this.props

    return <span>Search {query}</span>
  }
}

SearchMeat.propTypes = {
  query: PropTypes.string
}

const mapStateToProps = (state) => ({})
const mapDispatchToProps = (state) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SearchMeat)
