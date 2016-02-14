
import {get} from 'mori-ext'

let r = require('r-dom')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('../shallow-component')

let Tooltip = require('rc-tooltip')
let Icon = require('../icon')

let AppActions = require('../../actions/app-actions')
let classification_actions = require('../../constants/classification-actions')

let platform = require('../../util/os').itch_platform()

class SecondaryActions extends ShallowComponent {
  render () {
    let {game, cave, may_download} = this.props
    let error = false

    let children = []
    let game_id = game::get('id')

    let classification = game::get('classification')
    let action = classification_actions[classification]

    if (cave) {
      let cave_id = cave::get('id')
      let task = cave::get('task')

      if (task === 'error') {
        error = true

        children.push(this.retry_action(game_id))
        children.push(this.browse_action(cave_id))
        children.push(this.probe_action(cave_id))
      }

      if (task === 'idle') {
        // No errors
        children.push(this.purchase_action(game_id))

        if (action !== 'open') {
          children.push(this.browse_action(cave_id))
        }
      }

      if (task === 'error' || task === 'idle') {
        children.push(this.uninstall_action(cave_id))
      }
    } else {
      // No cave
      let has_min_price = game::get('min_price') > 0
      let main_is_purchase = !may_download && has_min_price

      // XXX should use API' can_be_bought but see
      // https://github.com/itchio/itch/issues/379
      if (!main_is_purchase) {
        children.push(this.purchase_action(game_id))
      }
    }

    let classSet = {
      cave_actions: true,
      error
    }

    return r.div({classSet}, children)
  }

  action (opts) {
    let {key, icon, on_click} = opts

    return this.tooltip(key, r.span({
      className: 'secondary_action',
      onClick: on_click
    }, r(Icon, {icon})))
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

  browse_action (cave_id) {
    return this.action({
      key: this.browse_i18n_key(),
      icon: 'folder-open',
      on_click: () => AppActions.explore_cave(cave_id)
    })
  }

  purchase_action (game_id) {
    return this.action({
      key: 'grid.item.purchase_or_donate',
      icon: 'cart',
      on_click: () => AppActions.initiate_purchase(game_id)
    })
  }

  retry_action (game_id) {
    return this.action({
      key: 'grid.item.retry',
      icon: 'refresh',
      on_click: () => AppActions.queue_game(game_id)
    })
  }

  probe_action (cave_id) {
    return this.action({
      key: 'grid.item.probe',
      icon: 'bug',
      on_click: () => AppActions.probe_cave(cave_id)
    })
  }

  uninstall_action (cave_id) {
    return this.action({
      key: 'grid.item.uninstall',
      icon: 'delete',
      on_click: () => AppActions.request_cave_uninstall(cave_id)
    })
  }

}

SecondaryActions.propTypes = {
  may_download: PropTypes.bool,
  cave: PropTypes.any,
  game: PropTypes.any
}

module.exports = SecondaryActions
