
let r = require('r-dom')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('../shallow-component')

let Tooltip = require('rc-tooltip')
let Icon = require('../icon')

let AppActions = require('../../actions/app-actions')
let classification_actions = require('../../constants/classification-actions')

let platform = require('../../util/os').itch_platform()

class SecondaryActions extends ShallowComponent {
  render () {
    let game = this.props.game
    let cave = this.props.cave

    let children = []
    let game_id = mori.get(game, 'id')

    let cave_id = mori.get(cave, 'id')
    let task = mori.get(cave, 'task')

    let classification = mori.get(game, 'classification')
    let action = classification_actions[classification]

    if (task === 'error') {
      children.push(this.tooltip('grid.item.retry', r.span({
        className: 'game_retry',
        onClick: () => AppActions.game_queue(game_id)
      }, [
        r(Icon, {icon: 'refresh'})
      ])))

      children.push(this.tooltip(this.browse_i18n_key(), r.span({
        className: 'game_explore',
        onClick: () => AppActions.cave_explore(cave_id)
      }, [
        r(Icon, {icon: 'folder-open'})
      ])))

      children.push(this.tooltip('grid.item.probe', r.span({
        className: 'game_probe',
        onClick: () => AppActions.cave_probe(cave_id)
      }, [
        r(Icon, {icon: 'bug'})
      ])))
    } else {
      // No errors
      children.push(this.tooltip('grid.item.purchase_or_donate', r.span({
        className: 'game_purchase',
        onClick: () => AppActions.game_purchase(game_id)
      }, [
        r(Icon, {icon: 'cart'})
      ])))

      if (action !== 'open') {
        children.push(this.tooltip(this.browse_i18n_key(), r.span({
          className: 'game_explore',
          onClick: () => AppActions.cave_explore(cave_id)
        }, [
          r(Icon, {icon: 'folder-open'})
        ])))
      }
    }

    children.push(this.tooltip('grid.item.uninstall', r.span({
      className: 'game_uninstall',
      onClick: () => AppActions.cave_request_uninstall(cave_id)
    }, [
      r(Icon, {icon: 'delete'})
    ])))

    let classSet = {
      cave_actions: true,
      error: (task === 'error')
    }

    return r.div({classSet}, children)
  }

  tooltip (key, component) {
    let t = this.t

    let label = t(key)
    let tooltip_opts = {
      mouseEnterDelay: 0.5,
      placement: 'top',
      overlay: r.span({}, label)
    }
    return r(Tooltip, tooltip_opts, component)
  }

  browse_i18n_key () {
    let fallback = 'grid.item.open_in_file_explorer'
    switch (platform) {
      case 'osx': return ['grid.item.open_in_file_explorer_osx', fallback]
      case 'linux': return ['grid.item.open_in_file_explorer_linux', fallback]
      default: return fallback
    }
  }

}

SecondaryActions.propTypes = {
  cave: PropTypes.any,
  game: PropTypes.any
}

module.exports = SecondaryActions
