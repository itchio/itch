
// adapted from https://github.com/keokilee/react-electron-webview

import React, {PropTypes, Component} from 'react'
import format from '../util/format'

import {each} from 'underline'

const EVENTS = [
  'close',
  'console-message',
  'crashed',
  'destroyed',
  'did-fail-load',
  'did-finish-load',
  'did-frame-finish-load',
  'did-get-redirect-request',
  'did-get-response-details',
  'did-navigate',
  'did-start-loading',
  'did-stop-loading',
  'dom-ready',
  'enter-html-full-screen',
  'gpu-crashed',
  'ipc-message',
  'leave-html-full-screen',
  'load-commit',
  'new-window',
  'page-favicon-updated',
  'page-title-set',
  'page-title-updated',
  'plugin-crashed'
]

export class WebView extends Component {
  constructor (props) {
    super(props)
    this.state = {loaded: false, webview: null}
  }

  componentDidMount () {
    const node = this.refs.webview
    console.log('did mount, node = ', node)

    // Set up listeners.
    this._bindEvents(node)
    this._assignMethods(node)
    this.setState({loaded: true, webview: node})
  }

  render () {
    console.log('our partition prop: ', this.props.partition)
    return (<webview {...this.props} ref='webview' ondomready={() => { console.log('yay domready') }}></webview>)
  }

  // Private methods
  _bindEvents (node) {
    EVENTS::each((ev) => {
      const listenerName = format.camelify(ev)
      node.addEventListener(ev, this.props[listenerName])
    })
  }

  _assignMethods (node) {
    console.log('putting dom-ready')
    node.addEventListener('dom-ready', () => {
      // console.log('got dom-ready, assigning methods')
      Object.getOwnPropertyNames(node)
            .filter((prop) => typeof prop === 'function')
            ::each((method, key) => {
              console.log('assigning method', key)
              this[method] = node[method]
            })
    })
  }
}

WebView.propTypes = {
  autosize: PropTypes.bool,
  disablewebsecurity: PropTypes.bool,
  httpreferrer: PropTypes.string,
  nodeintegration: PropTypes.bool,
  plugins: PropTypes.bool,
  preload: PropTypes.string,
  src: PropTypes.string,
  useragent: PropTypes.string
}

EVENTS::each((event) => {
  WebView.propTypes[format.camelify(event)] = PropTypes.func
})

export default WebView
