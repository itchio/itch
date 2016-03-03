
import r from 'r-dom'
import {PropTypes} from 'react'
import ShallowComponent from './shallow-component'

import Thumbnail from './game-cell/thumbnail'
import MainAction from './game-cell/main-action'
import SecondaryActions from './game-cell/secondary-actions'

import PlatformData from '../constants/platform-data'
import os from '../util/os'

const platform = os.itch_platform()

/* before you think you can download all itch.io games:
there's obviously server-side checking.
you'll get neat error logs for free though! */
const may_download_all = (process.env.TRUST_ME_IM_AN_ENGINEER === '1')

class GameCell extends ShallowComponent {
  render () {
    const {owned, game, cave} = this.props

    const min_price = game.min_price
    const free = (min_price === 0)
    const may_download = may_download_all || owned || free

    let platform_compatible = false
    for (const platform_spec of PlatformData) {
      if (platform === platform_spec.platform) {
        platform_compatible = !!game[platform_spec.field]
      }
    }
    const is_html = game.type === 'html'
    platform_compatible |= is_html

    const children = []
    children.push(r(Thumbnail, {cave, game}))

    const title = game.title
    children.push(r.div({className: 'game_title'}, title))

    // TODO: this never happens anymore, maybe we should make it happen
    // again but we don't have a good page to navigate to
    const user = game.user
    if (user) {
      r.div({className: 'game_author'}, user.display_name)
    }

    children.push(r(MainAction, {cave, game, platform_compatible, may_download}))

    children.push(r(SecondaryActions, {cave, game, may_download}))

    return r.div({className: 'game_cell'}, children)
  }
}

GameCell.propTypes = {
  game: PropTypes.object,
  cave: PropTypes.object
}

export default GameCell
