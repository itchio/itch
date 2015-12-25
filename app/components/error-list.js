
let r = require('r-dom')
let PropTypes = require('react').PropTypes
let translate = require('react-i18next').translate
let DeepComponent = require('./deep-component')

let format = require('../util/format')

/**
 * A bunch of errors displayed in a list
 */
class ErrorList extends DeepComponent {
  render () {
    let prefix = 'errors'
    let t = this.props.t
    let i18n_namespace = this.props.i18n_namespace
    if (i18n_namespace) {
      prefix = prefix + '.' + i18n_namespace
    }

    let errors = this.props.errors
    let before = this.props.before || ''

    if (!errors) {
      return r.div()
    }

    if (!Array.isArray(errors)) {
      errors = [errors]
    }

    return r.ul({className: 'form_errors'}, errors.map((error, key) => {
      let i18n_key = prefix + '.' + format.slugify(error)
      let message = t(i18n_key, {defaultValue: error})

      return r.li({key}, [
        before,
        message
      ])
    }))
  }
}

ErrorList.propTypes = {
  errors: PropTypes.oneOfType([PropTypes.array, PropTypes.string])
}

module.exports = translate('error-list')(ErrorList)
