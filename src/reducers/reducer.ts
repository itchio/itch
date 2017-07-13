import { IAction } from "../constants/action-types";
import { Reducer, handleActions } from "redux-actions";

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
  <Payload>(actionCreator: IActionCreator<Payload>, reducer: IActionReducer<
    State,
    Payload
  >): void;
}

interface IActionHandlerCallback<State> {
  (registerReducer: IRegisterReducer<State>): void;
}

export default function reducer<State>(
  initialState: State,
  cb: IActionHandlerCallback<State>,
): Reducer<State, State> {
  const actionReducers: IActionReducers<State> = {};

  cb(<
    Payload
  >(actionCreator: IActionCreator<Payload>, reducer: IActionReducer<State, Payload>) => {
    const sampleAction = actionCreator({} as any);
    if (actionReducers[sampleAction.type]) {
      throw new Error(`reducing same action type twice: ${sampleAction.type}`);
    }

    actionReducers[sampleAction.type] = reducer;
  });

  return handleActions<State, State>(actionReducers, initialState);
}
