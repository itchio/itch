
import TranslatedComponent from './translated-component'
import {isEqual} from 'underline'

/**
 * These components require a deep comparison because they do not use
 * immutable storage
 *
 * cf. https://www.youtube.com/watch?v=I7IdS-PbEgI
 */
class DeepComponent extends TranslatedComponent {

  shouldComponentUpdate (nextProps, nextState) {
    return !this.props::isEqual(nextProps) ||
           !this.state::isEqual(nextState)
  }

}

export default DeepComponent
