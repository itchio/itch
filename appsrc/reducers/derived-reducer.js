
export default function derived (reducer, derivedReducer) {
  return (state, action) => {
    const reducerFields = reducer(state, action)
    if (reducerFields === state) {
      // don't bother computing derived data if state is the same
      return state
    }

    const derivedFields = state ? derivedReducer(reducerFields) : {}
    return {...reducerFields, ...derivedFields}
  }
}
