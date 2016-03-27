
import r from 'r-dom'

import {PropTypes} from 'react'
import ShallowComponent from '../shallow-component'

import AppActions from '../../actions/app-actions'

import PlatformData from '../../constants/platform-data'
import os from '../../util/os'
const platform = os.itch_platform()

class Thumbnail extends ShallowComponent {
  render () {
    let game = this.props.game

    let platform_list = []
    let has_native = false

    for (let platform_spec of PlatformData) {
      if (!game[platform_spec.field]) {
        continue
      }
      let active = (platform === platform_spec.platform)
      has_native = has_native || active
      let classSet = {icon: true, active}
      classSet[`icon-${platform_spec.icon}`] = true
      platform_list.push(r.span({classSet}))
    }

    if (game.type === 'html') {
      let active = !has_native // prefer native builds
      let classSet = {icon: true, 'icon-earth': true, active}
      platform_list.push(r.span({classSet}))
    }

    let style = {}

    let cover_url = game.cover_url
    if (cover_url) {
      style.backgroundImage = `url('${cover_url}')`
    }

    let onClick = (e) => this.on_click(e)

    let classSet = {
      game_thumb: true,
      has_cover: cover_url
    }
    let children = []

    children.push(r.div({style, classSet, onClick}))

    if (game.short_text && game.short_text.length > 0) {
      children.push(r.div({className: 'game_short_text'}, game.short_text))
    }

    if (platform_list.length) {
      children.push(r.div({className: 'platforms'}, platform_list))
    }
    return r.div({className: 'bordered'}, children)
  }

  on_click (e) {
    let {cave, game} = this.props

    if (e.shiftKey) {
      AppActions.explore_cave(cave.id)
    } else if (e.altKey || e.ctrlKey) {
      AppActions.probe_cave(cave.id)
    } else {
      AppActions.browse_game(game.id, game.url)
    }
  }
}

Thumbnail.propTypes = {
  game: PropTypes.any,
  cave: PropTypes.any
}

export default Thumbnail
