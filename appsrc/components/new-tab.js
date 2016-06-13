
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {map} from 'underline'

import urls from '../constants/urls'
import * as actions from '../actions'

import Icon from './icon'

import {transformUrl} from '../util/navigation'
import os from '../util/os'
const osx = os.itchPlatform() === 'osx'

// TODO: show recommended for you?
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
  },
  {
    label: ['new_tab.on_sale'],
    icon: 'shopping_cart',
    path: 'url/' + urls.itchio + '/games/on-sale'
  },
  {
    label: ['new_tab.top_sellers'],
    icon: 'star',
    path: 'url/' + urls.itchio + '/games/top-sellers'
  },
  {
    label: ['new_tab.community'],
    icon: 'fire',
    path: 'url/' + urls.itchio + '/community'
  }
]

export class NewTab extends Component {
  constructor () {
    super()

    this.addressKeyUp = ::this.addressKeyUp
  }

  render () {
    const {t, tabId, evolveTab} = this.props

    return <div className='new-tab-meat'>
      <div className='hub-grid'>
        <div className='itch-logo'/>
        {newTabItems::map((item) => {
          const {label, icon, path} = item

          return <div className='hub-item new-tab-item' onClick={() => evolveTab({id: tabId, path})}>
            <Icon icon={icon}/>
            <span>{t.format(label)}</span>
          </div>
        })}

        <h2>{t('new_tab.titles.input')}</h2>
        <div className='browser-address-container'>
          <input className='browser-address' autoFocus onKeyUp={this.addressKeyUp} placeholder={t('new_tab.titles.browser_placeholder')}/>
          <span className='icon icon-earth'/>
          <div className='kb-shortcut'>
          {osx
            ? <Icon icon='command'/>
            : <Icon icon='ctrl'/>
          }
          +L
          </div>
        </div>
      </div>
    </div>
  }

  async addressKeyUp (e) {
    if (e.key === 'Enter') {
      let input = e.target.value
      if (input.length < 1) {
        return
      }

      const url = await transformUrl(input)
      const {tabId, evolveTab} = this.props
      evolveTab({id: tabId, path: `url/${url}`})
    }
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
