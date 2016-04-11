
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

export class FeaturedMeat extends Component {
  render () {
    return <span>{`Wouldn't featured content be nice?`}</span>
  }
}

FeaturedMeat.propTypes = {
  gameId: PropTypes.number
}

const mapStateToProps = (state) => ({})
const mapDispatchToProps = (state) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FeaturedMeat)
