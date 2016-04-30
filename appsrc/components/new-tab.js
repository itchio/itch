
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {map} from 'underline'

import urls from '../constants/urls'
import * as actions from '../actions'

import Icon from './icon'

const newTabItems = [
  {
    label: ['new_tab.twitter'],
    icon: 'twitter',
    path: 'url/https://twitter.com/search?q=itch.io&src=typd'
  },
  {
    label: ['new_tab.random'],
    icon: 'shuffle',
    path: 'url/' + urls.itchio + '/randomizer'
  }
]

export class NewTab extends Component {
  render () {
    const {t, tabId, evolveTab} = this.props

    return <div className='new-tab-meat'>
      <div className='hub-grid'>
        {newTabItems::map((item) => {
          const {label, icon, path} = item

          return <div className='hub-item new-tab-item' onClick={() => evolveTab({id: tabId, path})}>
            <Icon icon={icon}/>
            <span>{t.format(label)}</span>
          </div>
        })}
      </div>
    </div>
  }
}

NewTab.propTypes = {
  t: PropTypes.func.isRequired,
  tabId: PropTypes.string.isRequired
}

const mapStateToProps = (state) => ({})

const mapDispatchToProps = (dispatch) => ({
  evolveTab: (data) => dispatch(actions.evolveTab(data))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NewTab)
