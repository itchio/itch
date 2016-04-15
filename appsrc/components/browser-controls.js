
import listensToClickOutside from 'react-onclickoutside/decorator'
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import classNames from 'classnames'

export class BrowserControls extends Component {
  constructor () {
    super()
    this.state = {
      editingURL: false
    }

    this.startEditingURL = ::this.startEditingURL
    this.addressKeyUp = ::this.addressKeyUp
    this.addressBlur = ::this.addressBlur
    this.onAddressField = ::this.onAddressField
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
    const {editingURL} = this.state
    const {browserState} = this.props
    const {canGoBack, canGoForward, loading, url = ''} = browserState
    const {goBack, goForward, stop, reload, openDevTools} = this.props

    return <div className='browser-controls' onDoubleClick={openDevTools}>
      <span className={classNames('icon icon-arrow-left', {disabled: !canGoBack})} onClick={goBack}/>
      <span className={classNames('icon icon-arrow-right', {disabled: !canGoForward})} onClick={goForward}/>
      {
        loading
        ? <span className='icon icon-cross loading' onClick={stop}/>
        : <span className='icon icon-repeat' onClick={reload}/>
      }
      { editingURL
        ? <input type='text' ref={this.onAddressField} className='browser-address editing' defaultValue={url} onKeyUp={this.addressKeyUp} onBlur={this.addressBlur}/>
        : (url && url.length
          ? <span className='browser-address' onClick={this.startEditingURL}>{url}</span>
          : '')
      }

    </div>
  }

  startEditingURL () {
    this.setState({editingURL: true})
  }

  onAddressField (addressField) {
    if (!addressField) return
    addressField.focus()
    addressField.select()
  }

  addressKeyUp (e) {
    if (e.key === 'Enter') {
      const url = e.target.value
      this.setState({editingURL: false})
      this.props.loadURL(url)
    }
    if (e.key === 'Escape') {
      this.setState({editingURL: false})
    }
  }

  addressBlur () {
    this.setState({editingURL: false})
  }

  handleClickOutside () {
    this.setState({editingURL: false})
  }
}

BrowserControls.propTypes = {
  browserState: PropTypes.shape({
    url: PropTypes.string,
    loading: PropTypes.boolean,
    canGoBack: PropTypes.boolean,
    canGoForward: PropTypes.boolean
  }),

  goBack: PropTypes.func.isRequired,
  goForward: PropTypes.func.isRequired,
  stop: PropTypes.func.isRequired,
  reload: PropTypes.func.isRequired,
  openDevTools: PropTypes.func.isRequired,
  loadURL: PropTypes.func.isRequired,

  tabPath: PropTypes.string,
  tabData: PropTypes.object
}

const mapStateToProps = (state) => ({})
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(listensToClickOutside(BrowserControls))
