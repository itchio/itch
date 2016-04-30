
import {createStructuredSelector} from 'reselect'
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import * as actions from '../actions'

import urlParser from '../util/url'
import navigation from '../util/navigation'

import useragent from '../constants/useragent'
import staticTabData from '../constants/static-tab-data'

import querystring from 'querystring'
import ospath from 'path'

const injectPath = ospath.resolve(__dirname, '..', 'inject', 'browser.js')
const DONT_SHOW_WEBVIEWS = process.env.ITCH_DONT_SHOW_WEBVIEWS === '1'
const SHOW_DEVTOOLS = parseInt(process.env.DEVTOOLS, 10) > 1

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
    this.loadURL = ::this.loadURL
  }

  updateBrowserState (props = {}) {
    const {webview} = this.refs
    if (!webview) {
      console.log('Can\'t update browser state (no webview ref)')
      return
    }
    const browserState = {
      ...this.state.browserState,
      canGoBack: webview.canGoBack(),
      canGoForward: webview.canGoForward(),
      ...props
    }

    this.setState({ browserState })
  }

  componentDidMount () {
    const {webview} = this.refs
    const {tabId, navigate, evolveTab, tabDataFetched, tabReloaded} = this.props

    if (!webview) {
      console.log('Oh noes, can\'t listen to webview\'s soothing event stream')
      return
    }

    const frozen = staticTabData[tabId] || !tabId

    const handleSupportedUrl = (url) => {
      if (frozen) {
        console.log(tabId, 'frozen tab, forking off')
        navigate(`url/${url}`)
        return true
      }

      console.log(tabId, 'all good, navigating')
      return false
    }

    console.log(tabId, 'installing dom-ready handler...')

    webview.addEventListener('load-commit', () => this.with((wv) => this.updateBrowserState({url: wv.getURL()})))
    webview.addEventListener('did-start-loading', () => this.updateBrowserState({loading: true}))
    webview.addEventListener('did-stop-loading', () => this.updateBrowserState({loading: false}))

    webview.addEventListener('page-title-updated', (e) => {
      const {title} = e
      tabDataFetched(tabId, {webTitle: title})
      tabReloaded(tabId)
    })

    webview.addEventListener('page-favicon-updated', (e) => {
      const {favicons} = e
      tabDataFetched(tabId, {webFavicon: favicons[0]})
      tabReloaded(tabId)
    })

    if (frozen) {
      webview.addEventListener('will-navigate', (e) => {
        const {url} = e

        console.log(tabId, '(wv) will-navigate: ', url, e)

        // sometimes we get double will-navigate events because life is fun?!
        if (this.lastNavigationUrl === url && e.timeStamp - this.lastNavigationTimeStamp < 2000) {
          console.log('double, woo')
          this.with((wv) => {
            console.log(tabId, 'Force loading', this.props.url)
            wv.stop()
            wv.loadURL(this.props.url)
          })
          return
        }
        this.lastNavigationUrl = url
        this.lastNavigationTimeStamp = e.timeStamp

        // can't preventDefault, *sigh*

        if (handleSupportedUrl(url)) {
          console.log(tabId, 'Was supported, opened somewhere else, blocking', url)
          this.with((wv) => {
            console.log(tabId, 'Force loading', this.props.url)
            wv.stop()
            wv.loadURL(this.props.url)
          })
        } else {
          console.log(tabId, 'handleSupported returned false')
        }
      })
    }

    webview.addEventListener('new-window', (e) => {
      const {url, disposition} = e
      console.log(tabId, 'New window: ', url, disposition)
      navigate('url/' + url)
    })

    webview.addEventListener('dom-ready', () => {
      console.log(tabId, 'dom-ready!')
      this.updateBrowserState({loading: false})

      const webContents = webview.getWebContents()
      if (!webContents || webContents.isDestroyed()) return

      if (SHOW_DEVTOOLS) {
        webContents.openDevTools({detach: true})
      }

      // requests to 'itch-internal' are used to communicate between web content & the app
      let internalFilter = {
        urls: ['https://itch-internal/*']
      }
      webContents.session.webRequest.onBeforeSendHeaders(internalFilter, (details, callback) => {
        callback({cancel: true})

        let parsed = urlParser.parse(details.url)
        const {pathname, query} = parsed
        const params = querystring.parse(query)
        console.log(tabId, 'got itch internal request: ', pathname, params)

        switch (pathname) {
          case '/open-devtools':
            webContents.openDevTools({detach: true})
            break
          case '/parsed-itch-path':
            const {tabId} = this.props
            const newPath = params.path
            console.log(tabId, 'parsed itch path: ', tabId, newPath)
            evolveTab(tabId, newPath)
            break
          default:
            console.log('got itch-internal request: ', pathname)
        }
      })
    })
  }

  render () {
    const {tabData, tabPath, url, meId, controls} = this.props
    const {browserState} = this.state

    const {goBack, goForward, stop, reload, openDevTools, loadURL} = this
    const controlProps = {tabPath, tabData, browserState, goBack, goForward, stop, reload, openDevTools, loadURL}

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
      {DONT_SHOW_WEBVIEWS
        ? <div style={{padding: '10px'}}>Webviews disabled</div>
        : <webview ref='webview' src={url} partition={`persist:itchio-${meId}`} preload={injectPath} plugins useragent={useragent}/>
      }
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
    this.with((wv) => {
      wv.reload()
    })
    const {tabId, tabReloaded} = this.props
    tabReloaded(tabId)
  }

  goBack () {
    this.with((wv) => wv.goBack())
  }

  goForward () {
    this.with((wv) => wv.goForward())
  }

  loadURL (url) {
    this.with((wv) => {
      const parsed = urlParser.parse(url)
      if (!parsed.protocol) {
        url = `http://${url}`
      }

      if (navigation.isAppSupported(url)) {
        this.props.navigate(`url/${url}`)
      } else {
        const browserState = { ...this.state.browserState, url }
        this.setState({browserState})
        wv.loadURL(url)
      }
    })
  }
}

BrowserMeat.propTypes = {
  url: PropTypes.string.isRequired,
  tabPath: PropTypes.string,
  tabData: PropTypes.object,
  tabId: PropTypes.string.isRequired,
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
  navigate: (id, data) => dispatch(actions.navigate(id, data)),
  evolveTab: (id, path) => dispatch(actions.evolveTab({id, path})),
  tabDataFetched: (id, data) => dispatch(actions.tabDataFetched({id, data})),
  tabReloaded: (id) => dispatch(actions.tabReloaded({id}))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BrowserMeat)
