
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'

import TimeAgo from 'react-timeago-titlefix'
import format, {DATE_FORMAT} from '../util/format'

import moment from 'moment-timezone'

function momentBridge (t) {
  return function (count, unit, direction) {
    if (unit === 'second' && count <= 60) {
      return t('moment.now')
    }

    const m = moment.tz(Date.now(), 'UTC').tz(moment.tz.guess()).locale(t.lang).add({[unit]: count})
    return (direction === 'ago') ? m.toNow() : m.fromNow()
  }
}

export class NiceAgo extends Component {
  render () {
    const {t, date} = this.props

    const m = moment.tz(date, 'UTC').tz(moment.tz.guess())

    if (!m.isValid()) {
      return <span className='nice-ago'>?</span>
    }

    // pass empty title to TimeAgo on purpose so we don't have double tooltip on hover
    return <span className='nice-ago hint--bottom' data-hint={format.date(m, DATE_FORMAT, t.lang)}>
      <TimeAgo date={m} title='' formatter={momentBridge(t)}/>
    </span>
  }

  isValidDate (date) {
    return !isNaN(new Date(date).getTime())
  }
}

NiceAgo.propTypes = {
  date: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.object
  ]).isRequired,

  t: PropTypes.func.isRequired
}

const mapStateToProps = () => ({})
const mapDispatchToProps = () => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NiceAgo)
