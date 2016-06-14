
import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'
import {connect} from './connect'

import {map} from 'underline'

import Icon from './icon'

import listSecondaryActions from './game-actions/list-secondary-actions'

class GameBrowserContextActions extends Component {
  render () {
    const {items, error} = listSecondaryActions(this.props)

    return <div className={classNames('cave-actions', {error})}>
      {items::map(::this.action)}
    </div>
  }

  action (opts) {
    const {t, dispatch} = this.props
    const {action, icon, hint, label, type = 'action', classes = []} = opts
    const spanClasses = classNames('secondary-action', `type-${type}`, classes, {
      ['hint--top']: hint
    })

    return <span key={label} className={spanClasses} data-hint={hint} onClick={() => dispatch(action)}>
      <Icon icon={icon}/> {t.format(label)}
    </span>
  }
}

GameBrowserContextActions.propTypes = {
  t: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired
}

const mapStateToProps = () => ({})
const mapDispatchToProps = (dispatch) => ({dispatch})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameBrowserContextActions)
