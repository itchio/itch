
import {createStructuredSelector} from 'reselect'
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import classNames from 'classnames'

import * as actions from '../actions'

import urlParser from '../util/url'
const ITCH_HOST_RE = /^([^.]+)\.(itch\.io|itch\.ovh|localhost\.com:8080)$/

export class BrowserMeat extends Component {
  constructor () {
    super()
    this.state = {
      browserState: {
        canGoBack: false,
        canGoForward: false,
        loading: true,
        url: ''
      }
    }
  }

  updateBrowserState (props = {}) {
    const {webview} = this.refs
    if (!webview) {
      console.log(`Can't update browser state (no webview ref)`)
      return
    }
    const browserState = {
      ...this.state.browserState,
      canGoBack: webview.canGoBack(),
      canGoForward: webview.canGoForward(),
      ...props
    }

    this.setState({
      ...this.state,
      browserState
    })
  }

  componentDidMount () {
    const {webview} = this.refs
    const {navigate} = this.props

    if (!webview) {
      console.log(`Oh noes, can't listen to webview's soothing event stream`)
      return
    }
    webview.addEventListener('load-commit', () => this.updateBrowserState({url: webview.getURL()}))
    webview.addEventListener('did-start-loading', () => this.updateBrowserState({loading: true}))
    webview.addEventListener('did-stop-loading', () => this.updateBrowserState({loading: false}))
    webview.addEventListener('dom-ready', () => this.updateBrowserState({loading: false}))
    webview.addEventListener('will-navigate', (e) => {
      const {host, pathname} = urlParser.parse(e.url)
      if (ITCH_HOST_RE.test(host)) {
        const user = ITCH_HOST_RE.exec(host)[1]

        const pathItems = pathname.split('/')
        if (pathItems.length === 2) {
          if (pathItems[1].length > 0) {
            const game = pathItems[1]
            console.log(`Opening tab for ${user}/${game}`)
          } else {
            console.log(`Opening tab for ${user}`)
          }
          if (webview.getURL() === e.url) {
            webview.back()
          } else {
            webview.stop()
          }

          navigate(`url/${e.url}`)
        }
      }
    })
  }

  render () {
    const {url, meId, className, beforeControls = '', afterControls = '', aboveControls = ''} = this.props

    const classes = classNames('browser-meat', className)

    return <div className={classes}>
      <div className='game-essentials'>
        {beforeControls}
        <div className='controls'>
          {aboveControls}
          {this.browserControls()}
        </div>
        {afterControls}
      </div>
      <webview ref='webview' src={url} partition={`persist:itchio-${meId}`} plugins/>
    </div>
  }

  browserControls () {
    const {browserState} = this.state
    const {canGoBack, canGoForward, loading, url = ''} = browserState

    return <div className='browser-controls'>
      <span className={classNames('icon icon-arrow-left', {disabled: !canGoBack})} onClick={() => this.goBack()}/>
      <span className={classNames('icon icon-arrow-right', {disabled: !canGoForward})} onClick={() => this.goForward()}/>
      {
        loading
        ? <span className='icon icon-cross loading' onClick={() => this.stop()}/>
        : <span className='icon icon-repeat' onClick={() => this.reload()}/>
      }
      { url && url.length
        ? <span className='browser-address'>{url}</span>
        : '' }

    </div>
  }

  stop () {
    const {webview} = this.refs
    if (!webview) return
    webview.reload()
  }

  reload () {
    const {webview} = this.refs
    if (!webview) return
    webview.reload()
  }

  goBack () {
    const {webview} = this.refs
    if (!webview) return
    webview.goBack()
  }

  goForward () {
    const {webview} = this.refs
    if (!webview) return
    webview.goForward()
  }
}

BrowserMeat.propTypes = {
  url: PropTypes.string,
  className: PropTypes.string,
  meId: PropTypes.any,
  navigate: PropTypes.any,

  beforeControls: PropTypes.node,
  afterControls: PropTypes.node,
  aboveControls: PropTypes.node
}

const mapStateToProps = createStructuredSelector({
  meId: (state) => state.session.credentials.me.id
})

const mapDispatchToProps = (dispatch) => ({
  navigate: (path, data) => dispatch(actions.navigate(path, data))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BrowserMeat)
