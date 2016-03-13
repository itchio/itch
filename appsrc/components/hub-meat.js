
import React, {Component} from 'react'
import {connect} from './connect'

import HubSearchResults from './hub-search-results'
import HubItem from './hub-item'
import HubGhostItem from './hub-ghost-item'

const fakeIcon = 'https://downloads.2kgames.com/xcom2/blog_images/Bx987a1Y_uto0o471x_date.jpg'

export class HubMeat extends Component {
  render () {
    return <div className='hub_meat'>
      {this.fakeGrid()}
      <HubSearchResults/>
    </div>
  }

  fakeGrid () {
    const items = []
    let id = 0

    for (let i = 0; i < 25; i++) {
      items.push(<HubItem key={id++} game={{title: 'XCOM 2', coverUrl: fakeIcon}}/>)
    }
    for (let i = 0; i < 12; i++) {
      items.push(<HubGhostItem key={id++}/>)
    }

    return <div className='hub_grid'>
      {items}
    </div>
  }
}

const mapStateToProps = (state) => ({})
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubMeat)
