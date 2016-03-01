
const React = require('react')
const I18nStore = require('../stores/i18n-store')

class TranslatedComponent extends React.Component {

  constructor (props) {
    super(props)
  }

  componentWillMount () {
    this.mounted = true
    this.t = I18nStore.get_t()
  }

  componentDidMount () {
    this.onI18nChanged = () => {
      if (!this.mounted) return

      this.setState({ i18nLoadedAt: Date.now() })
    }

    I18nStore.on('change', this.onI18nChanged)
  }

  componentWillUnmount () {
    this.mounted = false
    if (this.onI18nChanged) {
      I18nStore.removeListener('change', this.onI18nChanged)
    }
  }
}

module.exports = TranslatedComponent
