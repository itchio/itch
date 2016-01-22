
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
      }

      if (task === 'idle') {
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

      if (task === 'error' || task === 'idle') {
        children.push(this.tooltip('grid.item.uninstall', r.span({
          className: 'game_uninstall',
          onClick: () => AppActions.cave_request_uninstall(cave_id)
        }, [
          r(Icon, {icon: 'delete'})
        ])))
      }
    } else {
      // No cave
      let has_min_price = game::get('min_price') > 0
      let main_is_purchase = !may_download && has_min_price

      // XXX should use API' can_be_bought but see
      // https://github.com/itchio/itch/issues/379
      if (!main_is_purchase) {
        children.push(this.tooltip('grid.item.purchase_or_donate', r.span({
          className: 'game_purchase',
          onClick: () => AppActions.game_purchase(game_id)
        }, [
          r(Icon, {icon: 'cart'})
        ])))
      }
    }

    let classSet = {
      cave_actions: true,
      error
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
  may_download: PropTypes.bool,
  cave: PropTypes.any,
  game: PropTypes.any
}

module.exports = SecondaryActions
