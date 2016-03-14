
import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux'

import Icon from './icon'

const defaultCoverUrl = 'static/images/itchio-textless-pink.svg'

export class HubSidebar extends Component {
  render () {
    return <div className='hub_sidebar'>
      {this.me()}

      <h2>Constant</h2>
      <section><span className='icon icon-star'/> Featured</section>
      <section><span className='icon icon-rocket'/> My creations</section>
      <section><span className='icon icon-heart-filled'/> Library</section>

      <h2>Transient</h2>
      <section className='active'><span className='icon icon-tag'/> Garden, Grow and Plant <div className='filler'/><span className='icon icon-cross'/></section>
      <section><span className='icon icon-play'/> Reap <div className='filler'/><span className='icon icon-cross'/></section>
      <section><span className='icon icon-play'/> FPV Freerider <div className='filler'/><span className='icon icon-cross'/></section>
      <section><span className='icon icon-users'/> Managore <div className='filler'/><span className='icon icon-cross'/></section>
      <section><span className='icon icon-tag'/> I made a Fall Out Boy collection and all I got was wrapping label tabs <div className='filler'/><span className='icon icon-cross'/></section>
    </div>
  }

  me () {
    const {me} = this.props
    const {coverUrl = defaultCoverUrl, username} = me

    return <section className='me'>
      <img src={coverUrl}/>
      <span>{username}</span>
      <div className='filler'/>
      <Icon icon='triangle-down'/>
    </section>
  }
}

HubSidebar.propTypes = {
  // TODO: flesh out
  me: PropTypes.object
}

const mapStateToProps = (state) => ({
  me: state.session.credentials.me
})
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubSidebar)
