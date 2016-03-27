
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import {map} from 'underline'

import TimeAgo from 'react-timeago'

class Downloads extends Component {
  render () {
    const {items} = this.props

    return <ul className='downloads-page'>
    {items::map((item) => {
      const {upload, date, id} = item
      return <li key={id} className='history-item'>
        {upload.id}
        <div className='timeago'>
          <TimeAgo date={date}/>
        </div>
      </li>
    })}
    </ul>
  }
}

Downloads.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    upload: PropTypes.object
  })),

  t: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  items: (state) => state.tasks.downloadsByDate
})
const mapDispatchToProps = () => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Downloads)
