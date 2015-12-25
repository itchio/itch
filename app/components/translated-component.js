
let React = require('react')
let I18nStore = require('../stores/i18n-store')

let i18n = I18nStore.get_state()
let t = i18n.t.bind(i18n)

class TranslatedComponent extends React.Component {

  constructor (props) {
    super(props)
  }

  componentWillMount () {
    this.mounted = true
    this.t = t
  }

  componentDidMount () {
    this.onI18nChanged = () => {
      console.log(`onI18nChanged for ${this.constructor.displayName}. mounted? ${this.mounted}`)
      if (!this.mounted) return

      this.setState({ i18nLoadedAt: Date.now() })
    }

    i18n.on('languageChanged loaded', this.onI18nChanged)
  }

  componentWillUnmount () {
    this.mounted = false
    if (this.onI18nChanged) {
      i18n.off('languageChanged', this.onI18nChanged)
      i18n.off('loaded', this.onI18nChanged)
    }
  }

}

module.exports = TranslatedComponent
