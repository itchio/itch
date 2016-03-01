
import r from 'r-dom'
import {PropTypes} from 'react'
import DeepComponent from './deep-component'

import format from '../util/format'

/**
 * A bunch of errors displayed in a list
 * Supports the following API i18n keys:
 *  - errors.api.login.incorrect_username_or_password
 *  - errors.api.login.password_must_be_provided
 *  - errors.api.login.username_must_be_provided
 */
class ErrorList extends DeepComponent {
  render () {
    let prefix = 'errors'

    const t = this.t
    const i18n_namespace = this.props.i18n_namespace
    if (i18n_namespace) {
      prefix = prefix + '.' + i18n_namespace
    }

    const {errors, before = ''} = this.props

    if (!errors) {
      return r.div()
    }

    const error_array = Array.isArray(errors) ? errors : [errors]

    return r.ul({className: 'form_errors'}, error_array.map((error, key) => {
      const i18n_key = prefix + '.' + format.slugify(error)
      const message = t(i18n_key, {defaultValue: error})
      return r.li({key}, [ before, message ])
    }))
  }
}

ErrorList.propTypes = {
  errors: PropTypes.any
}

export default ErrorList
