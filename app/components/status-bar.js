
let r = require('r-dom')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let translate = require('react-i18next').translate
let ShallowComponent = require('./shallow-component')

let Icon = require('./icon')

let AppActions = require('../actions/app-actions')

/**
 * Displays our current progress when checking for updates, etc.
 */
class StatusBar extends ShallowComponent {
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
        r.span('Click to restart & apply update!')
      ]
    } else if (available) {
      children = [
        r(Icon, {icon: 'download'}),
        r.span('Downloading update...')
      ]
    } else if (checking) {
      children = [
        r(Icon, {icon: 'stopwatch'}),
        r.span(t('checking'))
      ]
    } else if (uptodate) {
      children = [
        r(Icon, {icon: 'like'}),
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
