
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'

import TimeAgo from 'react-timeago'
import format, {DATE_FORMAT} from '../util/format'

export class NiceAgo extends Component {
  render () {
    const {t, date} = this.props

    if (!this.validDate(date)) {
      console.warn('NiceAgo fed invalid date: ', date)
      return <span className='nice-ago'>?</span>
    }

    if (Date.now() - date <= (60 * 1000)) {
      return <span className='nice-ago'>{t('moment.now')}</span>
    }

    return <span className='nice-ago hint--bottom' data-hint={format.date(date, DATE_FORMAT)}>
      <TimeAgo date={date} title=''/>
    </span>
  }

  validDate (date) {
    return (typeof date === 'number' && date > 0)
  }
}

NiceAgo.propTypes = {
  date: PropTypes.number.isRequired,

  t: PropTypes.func.isRequired
}

const mapStateToProps = () => ({})
const mapDispatchToProps = () => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NiceAgo)
