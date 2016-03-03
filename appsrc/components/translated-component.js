
import {Component} from 'react'
import env from '../env'

const test = (env.name === 'test')
const I18nStore = !test ? require('../stores/i18n-store').default : {
  get_t: () => (x) => x,
  on: () => null,
  removeListener: () => null
}

class TranslatedComponent extends Component {
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
      this.setState({i18nLoadedAt: Date.now()})
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

export default TranslatedComponent
