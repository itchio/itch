
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
const WILL_NAVIGATE_GRACE_PERIOD = 3000

import BrowserBar from './browser-bar'
import GameBrowserBar from './game-browser-bar'
import UserBrowserBar from './user-browser-bar'

import {transformUrl} from '../util/navigation'

// updated when switching accounts
let currentSession = null

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
    const {tabId, navigate, tabDataFetched, tabReloaded} = this.props

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

    webview.addEventListener('destroyed', (e) => {
      console.log(tabId, 'webview destroyed')
    })

    webview.addEventListener('did-navigate', (e) => this.with((wv) => {
      const {url} = e
      this.updateBrowserState({url})
    }))
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

        // sometimes we get double will-navigate events because life is fun?!
        if (this.lastNavigationUrl === url && e.timeStamp - this.lastNavigationTimeStamp < WILL_NAVIGATE_GRACE_PERIOD) {
          console.log('avoiding double nav to ${url}')
          this.with((wv) => {
            wv.stop()
            wv.loadURL(this.props.url)
          })
          return
        }
        this.lastNavigationUrl = url
        this.lastNavigationTimeStamp = e.timeStamp

        if (handleSupportedUrl(url)) {
          // url was supported & opened somewhere else, blocking load
          // attempt on this tab (preventDefault doesn't do anything)
          // cf. https://github.com/electron/electron/issues/1378
          console.log('stop/loading url ${url}')
          this.with((wv) => {
            wv.stop()
            wv.loadURL(this.props.url)
          })
        }
      })
    }

    webview.addEventListener('new-window', (e) => {
      const {url, disposition} = e
      console.log(tabId, 'New window: ', url, disposition)
      navigate('url/' + url)
    })

    webview.addEventListener('dom-ready', () => {
      console.log(tabId, 'dom-ready!, props url = ', this.props.url, 'wv url', webview.getURL())

      webview.executeJavaScript(`window.__itchInit && window.__itchInit(${JSON.stringify(tabId)})`)

      this.updateBrowserState({loading: false})

      const webContents = webview.getWebContents()
      if (!webContents || webContents.isDestroyed()) return

      if (SHOW_DEVTOOLS) {
        webContents.openDevTools({detach: true})
      }

      if (currentSession !== webContents.session) {
        this.setupItchInternal(webContents.session)
      }
    })

    const {url} = this.props
    if (url !== 'about:blank') {
      this.loadURL(url)
    } else {
      console.log(tabId, 'waiting for non-blank url')
    }
  }

  setupItchInternal (session) {
    currentSession = session

    // requests to 'itch-internal' are used to communicate between web content & the app
    let internalFilter = {
      urls: ['https://itch-internal/*']
    }

    session.webRequest.onBeforeSendHeaders(internalFilter, (details, callback) => {
      callback({cancel: true})

      let parsed = urlParser.parse(details.url)
      const {pathname, query} = parsed
      const params = querystring.parse(query)
      const {tabId} = params
      console.log(tabId, 'itch-internal', pathname, params)

      switch (pathname) {
        case '/open-devtools':
          const {webview} = this.refs
          if (webview && webview.getWebContents() && !webview.getWebContents().isDestroyed()) {
            webview.getWebContents().openDevTools({detach: true})
          }
          break
        case '/analyze-page':
          this.analyzePage(tabId, params.url)
          break
      }
    })
  }

  analyzePage (tabId, url) {
    const {evolveTab} = this.props

    const xhr = new window.XMLHttpRequest()
    xhr.responseType = 'document'
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) {
        return
      }
      const meta = xhr.responseXML.querySelector('meta[name="itch:path"]')
      if (meta) {
        const newPath = meta.content
        console.log(tabId, 'evolving', this.props.tabPath, ' => ', newPath)
        evolveTab(tabId, newPath)
      } else {
        console.log(tabId, 'no meta tag found in', url)
      }
    }
    xhr.open('GET', url)

    // itch.io pages don't have CORS, but this code doesn't run in
    // a webview so CSP doesn't apply to us.
    xhr.send()
  }

  componentWillReceiveProps (nextProps) {
    // we didn't have a proper url but now do
    if (nextProps.url) {
      const {webview} = this.refs
      if (!webview) {
        return
      }
      if (webview.src === '') {
        console.log(nextProps.tabId, 'finally got non-blank url', nextProps.url)
        this.loadURL(nextProps.url)
      }
    }
  }

  render () {
    const {tabId, tabData, tabPath, meId, controls} = this.props
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

    const partition = `persist:itchio-${meId}`

    return <div className='browser-meat'>
    {bar}
    {DONT_SHOW_WEBVIEWS
      ? <div style={{padding: '10px'}}>Webviews disabled</div>
      : <webview key={tabId} ref='webview' partition={partition} preload={injectPath} plugins useragent={useragent}/>
    }
    </div>
  }

  with (cb, opts = {insist: false}) {
    const {webview} = this.refs
    if (!webview) return

    const webContents = webview.getWebContents()
    if (!webContents) {
      if (opts.insist) {
        webview.addEventListener('dom-ready', () => {
          cb(webview, webview.getWebContents())
        })
      }
      return
    }

    if (webContents.isDestroyed()) return

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

  async loadURL (input) {
    const {tabId, navigate} = this.props
    const frozen = staticTabData[tabId] || !tabId

    const url = await transformUrl(input)

    if (navigation.isAppSupported(url) && frozen) {
      console.log(tabId, 'opening new tab with', url)
      navigate(`url/${url}`)
    } else {
      console.log(tabId, 'loading into webview', url)
      const browserState = { ...this.state.browserState, url }
      this.setState({browserState})
      const {webview} = this.refs
      if (webview) {
        webview.src = url
      }
    }
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
