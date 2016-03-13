
import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux'

const defaultCoverUrl = 'static/images/itchio-textless-pink.svg'

export class HubSidebar extends Component {
  render () {
    const {me} = this.props
    const {coverUrl = defaultCoverUrl, username} = me

    return <div className='hub_sidebar'>
      <section className='me'>
        <img src={coverUrl}/>
        <span>{username}</span>
      </section>
      <section><span className='icon icon-heart-filled'/> My creations</section>
      <section><span className='icon icon-heart-filled'/> My creations</section>
      <section><span className='icon icon-heart-filled'/> My creations</section>
      <section><span className='icon icon-heart-filled'/> My creations</section>
      <section><span className='icon icon-heart-filled'/> My creations</section>
    </div>
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
