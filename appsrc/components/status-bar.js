
let r = require('r-dom')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let Icon = require('./icon')

let AppActions = require('../actions/app-actions')

/**
 * Displays our current progress when checking for updates, etc.
 */
class StatusBar extends ShallowComponent {
  render () {
    let t = this.t
    let state = this.props.state || {}
    let {status, error, available, downloaded, checking, uptodate} = state.update || {}

    let children = []
    let active = true

    let onClick = () => null

    if (status) {
      onClick = AppActions.dismiss_status
      children = [
        r(Icon, {icon: 'heart-filled'}),
        r.span(status),
        r(Icon, {icon: 'cross'})
      ]
    } else if (error) {
      onClick = AppActions.dismiss_status
      children = [
        r(Icon, {icon: 'heart-broken'}),
        r.span('Error while checking for update: ' + error),
        r(Icon, {icon: 'cross'})
      ]
    } else if (downloaded) {
      onClick = AppActions.apply_self_update
      children = [
        r(Icon, {icon: 'install'}),
        r.span(t('status.downloaded'))
      ]
    } else if (available) {
      children = [
        r(Icon, {icon: 'download'}),
        r.span(t('status.downloading'))
      ]
    } else if (checking) {
      children = [
        r(Icon, {icon: 'stopwatch'}),
        r.span(t('status.checking'))
      ]
    } else if (uptodate) {
      children = [
        r(Icon, {icon: 'like'}),
        r.span(t('status.uptodate'))
      ]
    } else {
      active = false
    }

    return (
      r.div({classSet: {status_bar: true, active}},
        r.div({className: 'message', onClick}, children)
      )
    )
  }
}

StatusBar.propTypes = {
  update: PropTypes.any
}

module.exports = StatusBar
