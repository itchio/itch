import { IAction } from "../types/index";

interface IActionCreator<Payload> {
  (payload: Payload): IAction<Payload>;
}

interface IActionReducer<State, Payload> {
  (state: State, action: IAction<Payload>): State;
}

interface IActionReducers<State> {
  [key: string]: IActionReducer<State, any>;
}

interface IRegisterReducer<State> {
  <Payload>(
    actionCreator: IActionCreator<Payload>,
    reducer: IActionReducer<State, Payload>
  ): void;
}

interface IActionHandlerCallback<State> {
  (registerReducer: IRegisterReducer<State>): void;
}

function reducer<State>(
  initialState: State,
  cb: IActionHandlerCallback<State>,
  defaultReducer?: IActionReducer<State, any>
): IActionReducer<State, State> {
  const actionReducers: IActionReducers<State> = {};

  cb(
    <Payload>(
      actionCreator: IActionCreator<Payload>,
      reducer: IActionReducer<State, Payload>
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

  return (rs: State, action: IAction<any>) => {
    if (typeof rs === "undefined") {
      return initialState;
    }

    const reducer = actionReducers[action.type];
    if (reducer) {
      return reducer(rs, action);
    } else if (defaultReducer) {
      return defaultReducer(rs, action);
    }
    return rs;
  };
}

export default reducer;
