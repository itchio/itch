
let r = require('r-dom')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let Thumbnail = require('./game-cell/thumbnail')
let MainAction = require('./game-cell/main-action')
let SecondaryActions = require('./game-cell/secondary-actions')

let platform_data = require('../constants/platform-data')
let platform = require('../util/os').itch_platform()

/* before you think you can download all itch.io games:
there's obviously server-side checking.
you'll get neat error logs for free though! */
let may_download_all = (process.env.TRUST_ME_IM_AN_ENGINEER === '1')

class GameCell extends ShallowComponent {
  render () {
    let owned = this.props.owned
    let game = this.props.game
    let cave = this.props.cave

    let min_price = game.min_price
    let free = (min_price === 0)

    let may_download = may_download_all || owned || free

    let platform_compatible = false
    for (let platform_spec of platform_data) {
      if (platform === platform_spec.platform) {
        platform_compatible = !!game[platform_spec.field]
      }
    }
    platform_compatible |= game.type === 'html'

    let children = []

    children.push(r(Thumbnail, {cave, game}))

    let title = game.title
    children.push(r.div({className: 'game_title'}, title))

    let user = game.user
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

module.exports = GameCell
