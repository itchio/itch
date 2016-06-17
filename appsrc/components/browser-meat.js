
import {createStructuredSelector} from 'reselect'
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import * as actions from '../actions'

import urlParser from '../util/url'
import navigation from '../util/navigation'

import staticTabData from '../constants/static-tab-data'

import querystring from 'querystring'
import ospath from 'path'

const injectPath = ospath.resolve(__dirname, '..', 'inject', 'browser.js')
// const DONT_SHOW_WEBVIEWS = process.env.ITCH_DONT_SHOW_WEBVIEWS === '1'
const SHOW_DEVTOOLS = parseInt(process.env.DEVTOOLS, 10) > 1
const WILL_NAVIGATE_GRACE_PERIOD = 3000

import BrowserBar from './browser-bar'

import GameBrowserContext from './game-browser-context'

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
    const {webview} = this
    if (!webview) {
      return
    }
    if (!webview.partition || webview.partition === '') {
      console.warn(`${this.props.tabId}: webview has empty partition`)
    }

    const browserState = {
      ...this.state.browserState,
      canGoBack: webview.canGoBack(),
      canGoForward: webview.canGoForward(),
      ...props
    }

    this.setState({browserState})
  }

  domReady () {
    const {url} = this.props
    const {webview} = this

    const webContents = webview.getWebContents()
    if (!webContents || webContents.isDestroyed()) return

    if (SHOW_DEVTOOLS) {
      webContents.openDevTools({detach: true})
    }

    this.updateBrowserState({loading: false})

    if (currentSession !== webContents.session) {
      this.setupItchInternal(webContents.session)
    }

    if (url && url !== 'about:blank') {
      this.loadURL(url)
    }
  }

  didStartLoading () {
    this.updateBrowserState({loading: true})
  }

  didStopLoading () {
    this.updateBrowserState({loading: false})
  }

  pageTitleUpdated (e) {
    const {tabId, tabDataFetched} = this.props
    tabDataFetched(tabId, {webTitle: e.title})
  }

  pageFaviconUpdated (e) {
    const {tabId, tabDataFetched} = this.props
    tabDataFetched(tabId, {webFavicon: e.favicons[0]})
  }

  didNavigate (e) {
    const {tabId} = this.props
    const {url} = e
    this.updateBrowserState({url})
    this.analyzePage(tabId, url)
  }

  willNavigate (e) {
    if (!this.isFrozen()) {
      return
    }

    const {navigate} = this.props
    const {url} = e

    // sometimes we get double will-navigate events because life is fun?!
    if (this.lastNavigationUrl === url && e.timeStamp - this.lastNavigationTimeStamp < WILL_NAVIGATE_GRACE_PERIOD) {
      this.with((wv) => {
        wv.stop()
        wv.loadURL(this.props.url)
      })
      return
    }
    this.lastNavigationUrl = url
    this.lastNavigationTimeStamp = e.timeStamp

    navigate(`url/${url}`)

    // our own little preventDefault
    // cf. https://github.com/electron/electron/issues/1378
    this.with((wv) => {
      wv.stop()
      wv.loadURL(this.props.url)
    })
  }

  newWindow (e) {
    const {navigate} = this.props
    const {url} = e
    navigate('url/' + url)
  }

  isFrozen (e) {
    const {tabId} = this.props
    const frozen = staticTabData[tabId] || !tabId
    return frozen
  }

  setupItchInternal (session) {
    currentSession = session

    // requests to 'itch-internal' are used to communicate between web content & the app
    let internalFilter = {
      urls: ['https://itch-internal/*']
    }

    session.webRequest.onBeforeRequest(internalFilter, (details, callback) => {
      callback({cancel: true})

      let parsed = urlParser.parse(details.url)
      const {pathname, query} = parsed
      const params = querystring.parse(query)
      const {tabId} = params

      switch (pathname) {
        case '/open-devtools':
          const {webview} = this
          if (webview && webview.getWebContents() && !webview.getWebContents().isDestroyed()) {
            webview.getWebContents().openDevTools({detach: true})
          }
          break
        case '/analyze-page':
          this.analyzePage(tabId, params.url)
          break
        case '/evolve-tab':
          const {evolveTab} = this.props
          evolveTab(tabId, params.path)
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
      if (!xhr.responseXML) {
        return
      }
      const meta = xhr.responseXML.querySelector('meta[name="itch:path"]')
      if (meta) {
        const newPath = meta.content
        evolveTab(tabId, newPath)
      }
    }
    xhr.open('GET', url)

    // itch.io pages don't have CORS, but this code doesn't run in
    // a webview so CSP doesn't apply to us.
    xhr.send()
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.url) {
      const {webview} = this
      if (!webview) {
        return
      }
      if (webview.src === '' || webview.src === 'about:blank') {
        // we didn't have a proper url but now do
        this.loadURL(nextProps.url)
      }
    }
  }

  componentDidMount () {
    const {webviewShell} = this.refs

    // cf. https://github.com/electron/electron/issues/6046
    webviewShell.innerHTML = '<webview/>'
    const wv = webviewShell.querySelector('webview')
    this.webview = wv

    const {meId} = this.props
    const partition = `persist:itchio-${meId}`

    wv.partition = partition
    wv.plugins = true
    wv.preload = injectPath

    const callbackSetup = () => {
      wv.addEventListener('did-start-loading', ::this.didStartLoading)
      wv.addEventListener('did-stop-loading', ::this.didStopLoading)
      wv.addEventListener('will-navigate', ::this.willNavigate)
      wv.addEventListener('did-navigate', ::this.didNavigate)
      wv.addEventListener('page-title-updated', ::this.pageTitleUpdated)
      wv.addEventListener('page-favicon-updated', ::this.pageFaviconUpdated)
      wv.addEventListener('new-window', ::this.newWindow)
      this.domReady()

      // otherwise, back button is active and brings us back to 'about:blank'
      wv.clearHistory()
      wv.removeEventListener('dom-ready', callbackSetup)
    }
    wv.addEventListener('dom-ready', callbackSetup)

    const {tabId} = this.props
    wv.addEventListener('dom-ready', () => {
      wv.executeJavaScript(`window.__itchInit && window.__itchInit(${JSON.stringify(tabId)})`)
      this.didStopLoading()
    })

    wv.src = 'about:blank'
  }

  render () {
    const {tabData, tabPath, controls} = this.props
    const {browserState} = this.state

    const {goBack, goForward, stop, reload, openDevTools, loadURL} = this
    const controlProps = {tabPath, tabData, browserState, goBack, goForward, stop, reload, openDevTools, loadURL}

    let context = ''
    if (controls === 'game') {
      context = <GameBrowserContext {...controlProps}/>
    }

    return <div className='browser-meat'>
      {this.isFrozen()
        ? ''
        : <BrowserBar {...controlProps}/>
      }
      <div className='browser-main'>
        <div className='webview-shell' ref='webviewShell'></div>
        {context}
      </div>
    </div>
  }

  with (cb, opts = {insist: false}) {
    const {webview} = this
    if (!webview) return

    const webContents = webview.getWebContents()
    if (!webContents) {
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
    const {navigate} = this.props
    const url = await transformUrl(input)

    if (navigation.isAppSupported(url) && this.isFrozen()) {
      navigate(`url/${url}`)
    } else {
      const browserState = {...this.state.browserState, url}
      this.setState({browserState})

      const {webview} = this
      if (webview) {
        webview.loadURL(url)
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
  meId: (state) => (state.session.credentials.me || {id: 'anonymous'}).id
})

const mapDispatchToProps = (dispatch) => ({
  navigate: (id, data) => dispatch(actions.navigate(id, data)),
  evolveTab: (id, path) => dispatch(actions.evolveTab({id, path})),
  tabDataFetched: (id, data) => dispatch(actions.tabDataFetched({id, data, timestamp: +new Date()})),
  tabReloaded: (id) => dispatch(actions.tabReloaded({id}))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BrowserMeat)
