
let r = require('r-dom')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let translate = require('react-i18next').translate
let Component = require('./component')

let misc = require('./misc')

let AppActions = require('../actions/app-actions')

/**
 * Displays our current progress when checking for updates, etc.
 */
class StatusBar extends Component {
  render () {
    let t = this.props.t
    let update = this.props.update
    let status = mori.get(update, 'status')
    let error = mori.get(update, 'error')
    let available = mori.get(update, 'available')
    let downloaded = mori.get(update, 'downloaded')
    let checking = mori.get(update, 'checking')
    let uptodate = mori.get(update, 'uptodate')

    let children = []
    let active = true

    let onClick = () => null

    if (status) {
      onClick = AppActions.dismiss_status
      children = [
        r(misc.Icon, {icon: 'heart-filled'}),
        r.span(status),
        r(misc.Icon, {icon: 'cross'})
      ]
    } else if (error) {
      onClick = AppActions.dismiss_status
      children = [
        r(misc.Icon, {icon: 'heart-broken'}),
        r.span('Error while checking for update: ' + error),
        r(misc.Icon, {icon: 'cross'})
      ]
    } else if (downloaded) {
      onClick = AppActions.apply_self_update
      children = [
        r(misc.Icon, {icon: 'install'}),
        r.span('Click to restart & apply update!')
      ]
    } else if (available) {
      children = [
        r(misc.Icon, {icon: 'download'}),
        r.span('Downloading update...')
      ]
    } else if (checking) {
      children = [
        r(misc.Icon, {icon: 'stopwatch'}),
        r.span(t('checking'))
      ]
    } else if (uptodate) {
      children = [
        r(misc.Icon, {icon: 'like'}),
        r.span('Your itch is up-to-date!')
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

module.exports = translate('status-bar')(StatusBar)
