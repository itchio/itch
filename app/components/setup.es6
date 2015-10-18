
import React from 'react'
import {Component, PropTypes} from 'react'
import classNames from 'classnames'

import {Icon} from './misc'

export class SetupPage extends Component {
  render () {
    let {icon, message} = this.props
    let error = (icon === 'error')
    return <div className={classNames('setup_page', {error})}>
      <div className='setup_widget'>
        <div className='throbber_loader'>
          <Icon {...{icon}}/>
        </div>
        <div className='setup_message'>
          <div className='setup_message'>{message}</div>
        </div>
      </div>
    </div>
  }
}

SetupPage.propTypes = {
  icon: PropTypes.string,
  message: PropTypes.string
}
