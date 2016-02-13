
let r = require('r-dom')
import {get} from 'mori-ext'

let PropTypes = require('react').PropTypes
let ShallowComponent = require('../shallow-component')

let AppActions = require('../../actions/app-actions')

let platform_data = require('../../constants/platform-data')
let platform = require('../../util/os').itch_platform()

class Thumbnail extends ShallowComponent {
  render () {
    let game = this.props.game

    let platform_list = []
    let has_native = false

    for (let platform_spec of platform_data) {
      if (!game::get(platform_spec.field)) {
        continue
      }
      let active = (platform === platform_spec.platform)
      has_native = has_native || active
      let classSet = { icon: true, active }
      classSet[`icon-${platform_spec.icon}`] = true
      platform_list.push(r.span({ classSet }))
    }

    if (game::get('type') === 'html') {
      let active = !has_native // prefer native builds
      let classSet = { icon: true, 'icon-earth': true, active }
      platform_list.push(r.span({ classSet }))
    }

    let style = {}

    let cover_url = game::get('cover_url')
    if (cover_url) {
      style.backgroundImage = `url('${cover_url}')`
    }

    let onClick = (e) => this.on_click(e)

    let classSet = {
      game_thumb: true,
      has_cover: cover_url
    }
    let children = []

    children.push(r.div({ style, classSet, onClick }))

    if (platform_list.length) {
      children.push(r.div({className: 'platforms'}, platform_list))
    }
    return r.div({className: 'bordered'}, children)
  }

  on_click (e) {
    let {cave, game} = this.props

    let cave_id = cave::get('_id')
    let game_id = game::get('id')

    if (e.shiftKey) {
      AppActions.explore_cave(cave_id)
    } else if (e.altKey || e.ctrlKey) {
      AppActions.probe_cave(cave_id)
    } else {
      AppActions.browse_game(game_id)
    }
  }
}

Thumbnail.propTypes = {
  game: PropTypes.any,
  cave: PropTypes.any
}

module.exports = Thumbnail
