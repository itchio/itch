
export default function derived (reducer, derivedReducer) {
  return (state, action) => {
    const reducerFields = reducer(state, action)
    const derivedFields = state ? derivedReducer(reducerFields) : {}
    return {...reducerFields, ...derivedFields}
  }
}
