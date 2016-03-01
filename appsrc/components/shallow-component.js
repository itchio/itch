
import TranslatedComponent from './translated-component'
const shallowEqual = require('pure-render-mixin').shallowEqual

/**
 * These components only need a shallow comparison between old and new state,
 * and old and new properties, because they use immutable storage.
 *
 * cf. https://www.youtube.com/watch?v=I7IdS-PbEgI
 *
 * Every prop needs to be either a base type (number, string) or
 * an immutable data structure (mori map, list, vector). If you mutate
 * a value nested into a prop, but the prop's reference stays the same,
 * it won't rerender - and then you need 'DeepComponent' instead.
 */
class ShallowComponent extends TranslatedComponent {

  shouldComponentUpdate (nextProps, nextState) {
    return !shallowEqual(this.props, nextProps) ||
           !shallowEqual(this.state, nextState)
  }

}

export default ShallowComponent
