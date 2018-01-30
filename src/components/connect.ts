import { connect as reduxConnect } from "react-redux";

import { IRootState, IDispatch } from "../types";
import { ActionCreator, dispatcher } from "../actions/index";

export type IActionCreators = {
  [key: string]: ActionCreator<any>;
};

export type Dispatchers<T extends IActionCreators> = {
  [k in keyof T]: (payload: T[k]["payload"]) => void
};

interface IStateMapper {
  (rs: IRootState, props: any): any;
}

interface IDispatchMapper {
  (dispatch: IDispatch, props: any): any;
}

interface IConnectOpts {
  state?: IStateMapper;
  dispatch?: IDispatchMapper;
  actionCreators?: IActionCreators;
}

export function connect<TProps>(
  component: React.ComponentClass<any>,
  opts: IConnectOpts = {}
): React.ComponentClass<TProps> {
  let { dispatch, actionCreators } = opts;
  if (actionCreators) {
    let oldDispatch = dispatch;
    dispatch = (d, props) => {
      const result: any = oldDispatch ? oldDispatch(d, props) : {};
      for (const key of Object.keys(actionCreators!)) {
        result[key] = dispatcher(d, actionCreators![key]);
      }
      return result;
    };
  }

  return reduxConnect(opts.state, dispatch)(component);
}
