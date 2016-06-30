
import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'

import {connect} from '../connect'
import {createSelector, createStructuredSelector} from 'reselect'

import {findWhere} from 'underline'

import os from '../../util/os'
import ClassificationActions from '../../constants/classification-actions'

import isPlatformCompatible from '../../util/is-platform-compatible'

import MainAction from './main-action'
import SecondaryActions from './secondary-actions'

import * as actions from '../../actions'

const platform = os.itchPlatform()

class GameActions extends Component {
  render () {
    const {props} = this
    const {showSecondary, CustomSecondary} = props

    const classes = classNames('game-actions', `action-${props.action}`, `task-${props.task}`, {
      incompatible: !props.platformCompatible,
      uninstalled: !props.cave
    })

    return <div className={classes}>
      <MainAction {...props}/>
      {showSecondary
        ? <SecondaryActions {...props}/>
        : ''}
      {CustomSecondary
        ? <CustomSecondary {...props}/>
        : ''}
    </div>
  }

}

MainAction.propTypes = {
  // specified
  game: PropTypes.shape({
    id: PropTypes.any.isRequired
  }),
  showSecondary: PropTypes.bool,

  // derived
  animate: PropTypes.bool,
  action: PropTypes.string,
  cave: PropTypes.any,
  mayDownload: PropTypes.bool,
  canBeBought: PropTypes.bool,
  platformCompatible: PropTypes.bool,
  task: PropTypes.string,
  progress: PropTypes.number,
  cancellable: PropTypes.bool,

  t: PropTypes.func.isRequired,
  queueGame: PropTypes.func.isRequired,
  reportCave: PropTypes.func.isRequired,
  cancelCave: PropTypes.func.isRequired,
  initiatePurchase: PropTypes.func.isRequired,
  browseGame: PropTypes.func.isRequired,
  abortGameRequest: PropTypes.func.isRequired
}

const makeMapStateToProps = () => {
  const selector = createSelector(
    createStructuredSelector({
      game: (state, props) => props.game,
      cave: (state, props) => state.globalMarket.cavesByGameId[props.game.id],
      downloadKeys: (state, props) => state.market.downloadKeys,
      task: (state, props) => state.tasks.tasksByGameId[props.game.id],
      download: (state, props) => state.downloads.downloadsByGameId[props.game.id],
      meId: (state, props) => (state.session.credentials.me || {id: 'anonymous'}).id
    }),
    (happenings) => {
      const {game, cave, downloadKeys, task, download, meId} = happenings

      const animate = false
      let action = ClassificationActions[game.classification] || 'launch'
      // TODO: finish implementing that
      // if (cave && cave.upload && cave.upload.demo) {
      //   action += '_demo'
      // }

      const platformCompatible = (action === 'open' ? true : isPlatformCompatible(game))
      const cancellable = false
      const downloadKey = downloadKeys::findWhere({gameId: game.id})
      const hasMinPrice = game.minPrice > 0
      // FIXME game admins
      const canEdit = game.userId === meId
      const mayDownload = !!(downloadKey || !hasMinPrice || canEdit)
      const canBeBought = game.canBeBought

      const downloading = download && !download.finished

      return {
        cancellable,
        cave,
        animate,
        platform,
        mayDownload,
        canBeBought,
        downloadKey,
        platformCompatible,
        action,
        task: (task ? task.name : (downloading ? 'download' : (cave ? 'idle' : null))),
        progress: (task ? task.progress : (downloading ? download.progress : 0))
      }
    }
  )

  return selector
}

const mapDispatchToProps = (dispatch) => ({
  queueGame: (game) => dispatch(actions.queueGame({game})),
  requestCaveUninstall: (caveId) => dispatch(actions.requestCaveUninstall({caveId})),
  probeCave: (caveId) => dispatch(actions.probeCave({caveId})),
  exploreCave: (caveId) => dispatch(actions.exploreCave({caveId})),
  reportCave: (caveId) => dispatch(actions.reportCave({caveId})),
  cancelCave: (caveId) => dispatch(actions.cancelCave({caveId})),
  initiatePurchase: (game) => dispatch(actions.initiatePurchase({game})),
  navigate: (path, data) => dispatch(actions.navigate(path, data)),
  browseGame: (gameId, url) => dispatch(actions.initiatePurchase({gameId, url})),
  abortGameRequest: (game) => dispatch(actions.abortGameRequest({game}))
})

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(GameActions)
