
import env from '../env'

import {createSelector} from 'reselect'

import {connect as reduxConnect} from 'react-redux'
import {getT} from '../localizer'

const identity = (x) => x

const tMaker = createSelector(
  (state) => state.i18n,
  (i18n) => {
    const {lang, strings} = i18n
    if (env.name === 'test') {
      return identity
    } else {
      return getT(strings, lang)
    }
  }
)

const augment = createSelector(
  (state, base) => tMaker(state),
  (state, base) => base,
  (t, base) => {
    return {...base, t}
  }
)

export function connect (mapStateToProps, mapDispatchToProps) {
  const augmentedMapStateToProps = (state, props) => {
    if (mapStateToProps) {
      const base = mapStateToProps(state, props)
      if (typeof base === 'function') {
        return (state, props) => augment(state, base(state, props))
      } else {
        return augment(state, base)
      }
    } else {
      return augment(state, {})
    }
  }
  return reduxConnect(augmentedMapStateToProps, mapDispatchToProps)
}
