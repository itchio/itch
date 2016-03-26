
import env from '../env'

import {connect as reduxConnect} from 'react-redux'
import {getT} from '../localizer'

const augment = (state, base) => {
  if (env.name === 'test') {
    const t = (x) => x
    return {...base, t}
  } else {
    const {lang, strings} = state.i18n
    const t = getT(strings, lang)
    return {...base, t}
  }
}

export function connect (mapStateToProps, mapDispatchToProps) {
  const augmentedMapStateToProps = (state, props) => {
    const base = mapStateToProps(state, props)
    if (typeof base === 'function') {
      return (state, props) => augment(state, base(state, props))
    } else {
      return augment(state, base)
    }
  }
  return reduxConnect(augmentedMapStateToProps, mapDispatchToProps)
}
