
import {createStructuredSelector} from 'reselect'
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import classNames from 'classnames'
import ospath from 'path'

import * as actions from '../actions'

import urlParser from '../util/url'
import navigation from '../util/navigation'
import querystring from 'querystring'

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
    const {navigate, evolveTab} = this.props

    if (!webview) {
      console.log(`Oh noes, can't listen to webview's soothing event stream`)
      return
    }

    webview.addEventListener('load-commit', () => this.updateBrowserState({url: webview.getURL()}))
    webview.addEventListener('did-start-loading', () => this.updateBrowserState({loading: true}))
    webview.addEventListener('did-stop-loading', () => this.updateBrowserState({loading: false}))
    webview.addEventListener('dom-ready', () => {
      this.updateBrowserState({loading: false})

      const webContents = webview.getWebContents()
      webContents.on('will-navigate', (e, url) => {
        if (!navigation.isAppSupported(url)) {
          return
        }

        // as of 0.37.2, doc says this work, but it doesn't. amos suspects it
        // only works for WebContents of BrowserWindow, but not WebContents of WebView
        e.preventDefault()

        // this is a hack, but the whole 'will-navigate' is a fallback anyway,
        // injected javascript should prevent most navigation attempts
        if (webview.getURL() === url) {
          webview.goBack()
        } else {
          webview.stop()
        }
        navigate(`url/${url}`)
      })

      // requests to 'itch-internal' are used to communicate between web content & the app
      let internalFilter = {
        urls: ['https://itch-internal/*']
      }
      webContents.session.webRequest.onBeforeSendHeaders(internalFilter, (details, callback) => {
        callback({cancel: true})

        let parsed = urlParser.parse(details.url)
        const {pathname, query} = parsed
        const params = querystring.parse(query)
        console.log('got itch internal request: ', pathname, params)

        switch (pathname) {
          case '/open-devtools':
            webContents.openDevTools({detach: true})
            break
          case '/supported-url':
            navigate(`url/${params.url}`)
            break
          case '/parsed-itch-path':
            const oldPath = `url/${params.url}`
            const newPath = params.path
            evolveTab(oldPath, newPath)
            break
          default:
            console.log(`got itch-internal request: `, pathname)
        }
      })
    })
  }

  openDevTools () {
    const {webview} = this.refs
    if (!webview) return

    const webContents = webview.getWebContents()
    if (webContents && !webContents.isDestroyed()) {
      webContents.openDevTools({detach: true})
    }
  }

  render () {
    const {url, meId, className, beforeControls = '', afterControls = '', aboveControls = ''} = this.props

    const injectPath = ospath.resolve(__dirname, '..', 'inject', 'browser.js')

    const classes = classNames('browser-meat', className)

    return <div className={classes} onDoubleClick={() => this.openDevTools()}>
      <div className='browser-bread'>
        {beforeControls}
        <div className='controls'>
          {aboveControls}
          {this.browserControls()}
        </div>
        {afterControls}
      </div>
      <webview ref='webview' src={url} partition={`persist:itchio-${meId}`} preload={injectPath} plugins/>
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
  url: PropTypes.string.isRequired,
  rookie: PropTypes.bool,
  className: PropTypes.string,
  meId: PropTypes.any,
  navigate: PropTypes.any,

  evolveTab: PropTypes.func.isRequired,

  beforeControls: PropTypes.node,
  afterControls: PropTypes.node,
  aboveControls: PropTypes.node
}

const mapStateToProps = createStructuredSelector({
  meId: (state) => state.session.credentials.me.id
})

const mapDispatchToProps = (dispatch) => ({
  navigate: (path, data) => dispatch(actions.navigate(path, data)),
  evolveTab: (before, after) => dispatch(actions.evolveTab({before, after}))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BrowserMeat)
