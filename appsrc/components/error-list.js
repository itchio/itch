
import React, {PropTypes, Component} from 'react'
import {map} from 'underline'

import {slugify} from '../util/format'

// TODO: get t somewhere
const t = (x) => x

/**
 * A bunch of errors displayed in a list
 * Supports the following API i18n keys:
 *  - errors.api.login.incorrect_username_or_password
 *  - errors.api.login.password_must_be_provided
 *  - errors.api.login.username_must_be_provided
 */
class ErrorList extends Component {
  render () {
    const {errors, before = '', i18nNamespace} = this.props
    const prefix = i18nNamespace ? `errors.${i18nNamespace}` : 'errors'

    if (!errors) {
      return <div/>
    }

    const errorArray = Array.isArray(errors) ? errors : [errors]

    return <ul className='form-errors'>
      {errorArray::map((error, key) => {
        const i18nKey = prefix + '.' + slugify(error)
        const message = t(i18nKey, {defaultValue: error})
        return <li key={key}>{before}{message}</li>
      })}
    </ul>
  }
}

ErrorList.propTypes = {
  errors: PropTypes.any,
  before: PropTypes.node,
  i18nNamespace: PropTypes.string
}

export default ErrorList
