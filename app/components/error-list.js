
let r = require('r-dom')
let PropTypes = require('react').PropTypes
let translate = require('react-i18next').translate
let DeepComponent = require('./deep-component')

/**
 * A bunch of errors displayed in a list
 */
class ErrorList extends DeepComponent {
  render () {
    let errors = this.props.errors
    let before = this.props.before || ''

    if (!errors) {
      return r.div()
    }

    if (!Array.isArray(errors)) {
      errors = [errors]
    }

    return r.ul({className: 'form_errors'}, errors.map((error, key) => {
      return r.li({key}, [
        before,
        error
      ])
    }))
  }
}

ErrorList.propTypes = {
  errors: PropTypes.oneOfType([PropTypes.array, PropTypes.string])
}

module.exports = translate('error-list')(ErrorList)
