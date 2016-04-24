
import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'

import Icon from './icon'
import {map} from 'underline'

import listensToClickOutside from 'react-onclickoutside/decorator'
import {connect} from './connect'

export class Dropdown extends Component {

  constructor () {
    super()
    this.state = {open: false}
  }

  render () {
    const {t, items, inner, className = ''} = this.props

    const {open} = this.state
    const dropdownClasses = classNames('dropdown', {active: open})

    const children = items::map((item) => {
      const {label, icon, onClick} = item

      return <section className='dropdown-item' key={label + '-' + icon} onClick={onClick}>
        <Icon icon={icon}/>
        {t.apply(null, label)}
      </section>
    })

    return <div style={{position: 'relative'}} className={className}>
      <div onClick={this.toggle.bind(this)}>{inner}</div>
      <div className='dropdown-container'>
        <div className={dropdownClasses}>
          {children}
        </div>
      </div>
    </div>
  }

  toggle () {
    this.setState({...this.state, open: !this.state.open})
  }

  close () {
    this.setState({...this.state, open: false})
  }

  handleClickOutside () {
    this.close()
  }

}

Dropdown.propTypes = {
  inner: PropTypes.element,
  className: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.array.isRequired,
    icon: PropTypes.string
  })),

  t: PropTypes.func.isRequired
}

const listening = listensToClickOutside(Dropdown)

const mapStateToProps = (state) => ({})
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(listening)
