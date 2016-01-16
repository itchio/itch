
let r = require('r-dom')
let mori = require('mori')
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
    let name = this.props.name
    let panel = this.props.panel
    let label = this.props.label
    let progress = this.props.progress
    let before = this.props.before || ''
    let error = this.props.error
    let games = this.props.games || {}

    let count = this.props.count
    if (typeof count === 'undefined') {
      let relevant_games = mori.get(games, name) || mori.list()
      count = mori.count(relevant_games)
    }
    let current = (name === panel)

    let _progress = progress ? ` (${(progress * 100).toFixed()}%)` : ''
    let _label = `${label}${_progress}`

    return (
      r.div({classSet: {panel_link: true, current, [className]: true}, onClick: () => AppActions.focus_panel(this.props.name)}, [
        before,
        _label,
        (count > 0
        ? r.span({className: 'bubble'}, count)
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
