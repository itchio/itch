
import r from 'r-dom'
import {Component} from 'react'

export default class IntroLayout extends Component {

  render () {
    // const {errors, main, status} = this.props
    //
    // r.div({className: 'intro_page'}, [
    //   r.div({className: 'login_form'}, [
    //     r.img({className: 'logo', src: 'static/images/bench-itch.png'}),
    //     r.div({className: 'login_box'}, [
    //       r(LoginForm, {state})
    //     ])
    //   ])
    // ])

    return r.span({}, 'intro layout')
  }

}
