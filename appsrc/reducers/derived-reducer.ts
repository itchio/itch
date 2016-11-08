
import {Reducer, Action} from "redux";

export default function derived <T> (reducer: Reducer<T>, derivedReducer: (state: T) => T): Reducer<T> {
  return (state: T, action: Action) => {
    const reducerFields = reducer(state, action);
    const derivedFields = state ? derivedReducer(reducerFields) : {};
    return Object.assign({}, reducerFields, derivedFields);
  };
}
