
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import {map} from 'underline'

import TimeAgo from 'react-timeago'

class History extends Component {
  render () {
    const {t, items} = this.props

    return <ul className='history-page'>
    {items::map((item) => {
      const {label, date, id} = item
      return <li key={id} className='history-item'>
        {t.format(label)}
        <div className='timeago'>
          <TimeAgo date={date}/>
        </div>
      </li>
    })}
    </ul>
  }
}

History.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.array
  })),

  t: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  items: (state) => state.history.itemsByDate
})
const mapDispatchToProps = () => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(History)
