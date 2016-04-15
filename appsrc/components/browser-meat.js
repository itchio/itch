
import {createStructuredSelector} from 'reselect'
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import * as actions from '../actions'

import urlParser from '../util/url'
import navigation from '../util/navigation'
import useragent from '../constants/useragent'

import querystring from 'querystring'
import ospath from 'path'

const injectPath = ospath.resolve(__dirname, '..', 'inject', 'browser.js')

import BrowserBar from './browser-bar'
import GameBrowserBar from './game-browser-bar'
import UserBrowserBar from './user-browser-bar'

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

    this.goBack = ::this.goBack
    this.goForward = ::this.goForward
    this.reload = ::this.reload
    this.stop = ::this.stop
    this.openDevTools = ::this.openDevTools
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

    webview.addEventListener('load-commit', () => this.with((wv) => this.updateBrowserState({url: wv.getURL()})))
    webview.addEventListener('did-start-loading', () => this.updateBrowserState({loading: true}))
    webview.addEventListener('did-stop-loading', () => this.updateBrowserState({loading: false}))
    webview.addEventListener('dom-ready', () => {
      this.updateBrowserState({loading: false})

      const webContents = webview.getWebContents()
      if (!webContents || webContents.isDestroyed()) return

      webContents.on('will-navigate', (e, url) => {
        if (!navigation.isAppSupported(url)) {
          return
        }

        // as of 0.37.2, doc says this work, but it doesn't. amos suspects it
        // only works for WebContents of BrowserWindow, but not WebContents of WebView
        e.preventDefault()

        this.with((wv) => {
          // this is a hack, but the whole 'will-navigate' approach is a fallback anyway,
          // injected javascript should prevent most navigation attempts
          if (wv.getURL() === url) {
            this.goBack()
          } else {
            this.stop()
          }
        })
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

  render () {
    const {tabData, tabPath, url, meId, controls} = this.props
    const {browserState} = this.state

    const {goBack, goForward, stop, reload, openDevTools} = this
    const controlProps = {tabPath, tabData, browserState, goBack, goForward, stop, reload, openDevTools}

    let bar
    if (controls === 'game') {
      bar = <GameBrowserBar {...controlProps}/>
    } else if (controls === 'user') {
      bar = <UserBrowserBar {...controlProps}/>
    } else {
      bar = <BrowserBar {...controlProps}/>
    }

    return <div className='browser-meat'>
      {bar}
      <webview ref='webview' src={url} partition={`persist:itchio-${meId}`} preload={injectPath} plugins useragent={useragent}/>
    </div>
  }

  with (cb) {
    const {webview} = this.refs
    if (!webview) return

    const webContents = webview.getWebContents()
    if (!webContents || webContents.isDestroyed()) return

    cb(webview, webContents)
  }

  openDevTools () {
    this.with((wv, wc) => wc.openDevTools({detach: true}))
  }

  stop () {
    this.with((wv) => wv.stop())
  }

  reload () {
    this.with((wv) => wv.reload())
    const {tabPath, tabReloaded} = this.props
    tabReloaded(tabPath)
  }

  goBack () {
    this.with((wv) => wv.goBack())
  }

  goForward () {
    this.with((wv) => wv.goForward())
  }
}

BrowserMeat.propTypes = {
  url: PropTypes.string.isRequired,
  tabPath: PropTypes.string,
  tabData: PropTypes.object,
  className: PropTypes.string,
  meId: PropTypes.any,
  navigate: PropTypes.any,

  tabReloaded: PropTypes.func.isRequired,
  evolveTab: PropTypes.func.isRequired,

  controls: PropTypes.oneOf(['generic', 'game', 'user'])
}

const mapStateToProps = createStructuredSelector({
  meId: (state) => state.session.credentials.me.id
})

const mapDispatchToProps = (dispatch) => ({
  navigate: (path, data) => dispatch(actions.navigate(path, data)),
  tabReloaded: (path) => dispatch(actions.tabReloaded({path})),
  evolveTab: (before, after) => dispatch(actions.evolveTab({before, after}))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BrowserMeat)
