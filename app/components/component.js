'use strict'

let React = require('react')
let shallowEqual = require('pure-render-mixin').shallowEqual

class Component extends React.Component {

  shouldComponentUpdate (nextProps, nextState) {
    return !shallowEqual(this.props, nextProps) ||
           !shallowEqual(this.state, nextState)
  }

}

module.exports = Component
