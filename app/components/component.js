'use nodent';'use strict'

import React from 'react'
import {shallowEqual} from 'pure-render-mixin'

class Component extends React.Component {

  shouldComponentUpdate (nextProps, nextState) {
    return !shallowEqual(this.props, nextProps) ||
           !shallowEqual(this.state, nextState)
  }

}

export default Component
