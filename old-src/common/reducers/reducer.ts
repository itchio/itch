import { Action } from "common/types";

interface ActionCreator<Payload> {
  (payload: Payload): Action<Payload>;
}

interface ActionReducer<State, Payload> {
  (state: State, action: Action<Payload>): State;
}

interface ActionReducers<State> {
  [key: string]: ActionReducer<State, any>;
}

interface RegisterReducer<State> {
  <Payload>(
    actionCreator: ActionCreator<Payload>,
    reducer: ActionReducer<State, Payload>
  ): void;
}

interface ActionHandlerCallback<State> {
  (registerReducer: RegisterReducer<State>): void;
}

function reducer<State>(
  initialState: State,
  cb: ActionHandlerCallback<State>,
  defaultReducer?: ActionReducer<State, any>
): ActionReducer<State, State> {
  const actionReducers: ActionReducers<State> = {};

  cb(
    <Payload>(
      actionCreator: ActionCreator<Payload>,
      reducer: ActionReducer<State, Payload>
    ) => {
      const sampleAction = actionCreator({} as any);
      if (actionReducers[sampleAction.type]) {
        throw new Error(
          `reducing same action type twice: ${sampleAction.type}`
        );
      }

      actionReducers[sampleAction.type] = reducer;
    }
  );

  return (rs: State, action: Action<any>) => {
    if (typeof rs === "undefined") {
      return initialState;
    }

    if (action) {
      const reducer = actionReducers[action.type];
      if (reducer) {
        return reducer(rs, action);
      } else if (defaultReducer) {
        return defaultReducer(rs, action);
      }
    }
    return rs;
  };
}

export default reducer;
