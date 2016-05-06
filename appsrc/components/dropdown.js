
import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'

import Icon from './icon'
import {map} from 'underline'

import listensToClickOutside from 'react-onclickoutside'
import {connect} from './connect'

export class Dropdown extends Component {

  constructor () {
    super()
    this.state = {open: false}
  }

  render () {
    const {t, dispatch, items, inner, className = 'dropdown-container'} = this.props

    const {open} = this.state
    const containerClasses = classNames(className, {disabled: items.length === 0})
    const dropdownClasses = classNames('dropdown', {active: open})

    const children = items::map((item) => {
      const {label, icon, action, type} = item
      let {onClick = () => dispatch(action)} = item
      const itemClasses = classNames('dropdown-item', `type-${type}`)

      return <section className={itemClasses} key={label + '-' + icon} onClick={() => { onClick(); this.close() }}>
        <Icon icon={icon}/>
        {t.format(label)}
      </section>
    })

    return <div style={{position: 'relative'}} className={containerClasses}>
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

  t: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired
}

const listening = listensToClickOutside(Dropdown)

const mapStateToProps = (state) => ({})
const mapDispatchToProps = (dispatch) => ({dispatch})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(listening)
