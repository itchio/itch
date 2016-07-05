
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import * as actions from '../actions'

import Icon from './icon'

/**
 * Unapologetically and heavily inspired from Google Chrome's "shit went wrong" tab
 */
export class Toast extends Component {
  constructor () {
    super()
    this.state = {
      expanded: false
    }

    this.toggleExpand = ::this.toggleExpand
    this.sendFeedback = ::this.sendFeedback
    this.reload = ::this.reload
  }

  toggleExpand () {
    this.setState({
      expanded: !this.state.expanded
    })
  }

  sendFeedback () {
    const {reportIssue, data} = this.props
    const {error} = data

    reportIssue({log: (error.stack || ('' + error))})
  }

  reload (e) {
    const {evolveTab, data, tabId} = this.props
    const {path} = data
    const untoastedPath = path.replace(/^toast\//, '')

    evolveTab({id: tabId, path: untoastedPath, quick: true})
  }

  render () {
    const {t, data = {}} = this.props

    return <div className='toast-meat'>
    <Icon icon='heart-broken' classes='leader'/>
    <h2>{t('toast.title')}</h2>

    <p>{t('toast.message')} {t('toast.call_to_action')}</p>

    <div className='button' onClick={this.reload}>
    <Icon icon='repeat'/> {t('toast.actions.reload')}
    </div>

    <span className='link' onClick={this.toggleExpand}>{t('toast.actions.learn_more')}</span>

    {this.state.expanded
    ? <p className='error'>{data.error || t('toast.no_info_available')}</p>
    : ''}

    <span className='link' onClick={this.sendFeedback}>{t('toast.actions.report')}</span>
    
    </div>
  }
}

Toast.propTypes = {
  t: PropTypes.func.isRequired,
  data: PropTypes.string.isRequired,
  tabId: PropTypes.string.isRequired,

  evolveTab: PropTypes.func.isRequired,
  reportIssue: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({})

const mapDispatchToProps = (dispatch) => ({
  evolveTab: (data) => dispatch(actions.evolveTab(data)),
  reportIssue: (payload) => dispatch(actions.reportIssue(payload))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Toast)
