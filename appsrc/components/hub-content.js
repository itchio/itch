
import React, {Component} from 'react'
import {connect} from 'react-redux'

class HubItem extends Component {
  render () {
    return <div className='hub_item'>
      <section className='cover' style={{backgroundImage: `url("https://downloads.2kgames.com/xcom2/blog_images/Bx987a1Y_uto0o471x_date.jpg")`}}/>

      <section className='actions'>
        <div className='button'>
          <span className='icon icon-checkmark'/>
          <span>Launch</span>
        </div>
      </section>
    </div>
  }
}

export class HubContent extends Component {
  render () {
    return <div className='hub_content'>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <HubItem/>
      <div className='hub_filler'></div>
      <div className='hub_filler'></div>
      <div className='hub_filler'></div>
      <div className='hub_filler'></div>
      <div className='hub_filler'></div>
      <div className='hub_filler'></div>
      <div className='hub_filler'></div>
      <div className='hub_filler'></div>
      <div className='hub_filler'></div>
      <div className='hub_filler'></div>
    </div>
  }
}

const mapStateToProps = (state) => ({})
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubContent)
