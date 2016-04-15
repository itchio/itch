
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import classNames from 'classnames'

export class BrowserControls extends Component {
  openDevTools () {
    const {webview} = this.refs
    if (!webview) return

    const webContents = webview.getWebContents()
    if (webContents && !webContents.isDestroyed()) {
      webContents.openDevTools({detach: true})
    }
  }

  render () {
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
      { url && url.length
        ? <span className='browser-address'>{url}</span>
        : '' }

    </div>
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

  tabPath: PropTypes.string,
  tabData: PropTypes.object
}

const mapStateToProps = (state) => ({})
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BrowserControls)
