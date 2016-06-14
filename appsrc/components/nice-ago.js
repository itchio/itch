
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'

import TimeAgo from 'react-timeago'
import format, {DATE_FORMAT} from '../util/format'

import moment from 'moment'

function momentBridge (t) {
  return function (count, unit, direction) {
    const m = moment().locale(t.lang).add({[unit]: count})
    const ret = (direction === 'ago') ? m.toNow() : m.fromNow()
    console.log('for ', count, unit, direction, ' got ' + ret)
    return ret
  }
}

export class NiceAgo extends Component {
  render () {
    const {t, date} = this.props

    if (!this.isValidDate(date)) {
      return <span className='nice-ago'>?</span>
    }

    if (Date.now() - date <= (60 * 1000)) {
      return <span className='nice-ago'>{t('moment.now')}</span>
    }

    // pass empty title to TimeAgo on purpose so we don't have double tooltip on hover
    return <span className='nice-ago hint--bottom' data-hint={format.date(date, DATE_FORMAT, t.lang)}>
      <TimeAgo date={date} title='' formatter={momentBridge(t)}/>
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
