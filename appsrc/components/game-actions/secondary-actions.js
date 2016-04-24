
import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'

import {connect} from '../connect'
import Icon from '../icon'

import listSecondaryActions from './list-secondary-actions'
import {map} from 'underline'

class SecondaryActions extends Component {
  render () {
    const {items, error} = listSecondaryActions(this.props)

    return <div className={classNames('cave-actions', {error})}>
      { items::map(::this.action) }
    </div>
  }

  action (opts) {
    const {t, dispatch} = this.props
    const {action, label, icon} = opts

    return <span key={label} className='secondary-action hint--top' onClick={() => dispatch(action)} data-hint={t.format(label)}>
      <Icon icon={icon}/>
    </span>
  }
}

SecondaryActions.propTypes = {
  mayDownload: PropTypes.bool,
  cave: PropTypes.object,
  game: PropTypes.object,
  task: PropTypes.string,
  action: PropTypes.string,

  t: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({})
const mapDispatchToProps = (dispatch) => ({dispatch})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SecondaryActions)
