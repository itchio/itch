
let r = require('r-dom')
import { count } from 'grovel'

let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let ProgressBar = require('./progress-bar')
let ErrorList = require('./error-list')

let AppActions = require('../actions/app-actions')

/**
* A sidebar link to one of the library's panels. Could
* be a link to a tab, or to a specific collection or cave.
*/
class LibraryPanelLink extends ShallowComponent {
  render () {
    let className = this.props.className
    let {name, panel, label, progress, error} = this.props
    let before = this.props.before || ''
    let games = this.props.games || {}

    let num_items = this.props.count
    if (typeof num_items === 'undefined') {
      num_items = games[name]::count()
    }
    let current = (name === panel)

    let _progress = (progress > 0) ? ` (${(progress * 100).toFixed()}%)` : ''
    let _label = `${label}${_progress}`

    return (
      r.div({classSet: {panel_link: true, current, [className]: true}, onClick: () => AppActions.focus_panel(this.props.name)}, [
        before,
        _label,
        (num_items > 0
        ? r.span({className: 'bubble'}, num_items)
        : ''),
        r(ProgressBar, {progress}),
        r(ErrorList, {errors: error})
      ])
    )
  }
}

LibraryPanelLink.propTypes = {
  name: PropTypes.string,
  panel: PropTypes.string,
  label: PropTypes.string,
  progress: PropTypes.number,
  error: PropTypes.any,
  games: PropTypes.object,
  before: PropTypes.any
}

module.exports = LibraryPanelLink
