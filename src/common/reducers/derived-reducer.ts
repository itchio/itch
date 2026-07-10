import { Action } from "common/types";

function derived<T>(
  reducer: (state: T, action: Action<any>) => T,
  derivedReducer: (state: any) => any
): (state: T, action: Action<any>) => T {
  return (state: T, action: Action<any>) => {
    const reducerFields = reducer(state, action);
    if (state) {
      return {
        ...reducerFields,
        ...derivedReducer(reducerFields),
      };
    } else {
      return reducerFields;
    }
  };
}

export default derived;
