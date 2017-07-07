import { connect as reduxConnect } from "react-redux";

import { IAppState } from "../types";
import { IDispatch } from "../constants/action-types";

interface IStateMapper {
  (state: IAppState, props: any): any;
}

interface IDispatchMapper {
  (dispatch: IDispatch, props: any): any;
}

interface IConnectOpts {
  state?: IStateMapper;
  dispatch?: IDispatchMapper;
}

export function connect<TProps>(
  component: React.ComponentClass<any>,
  opts: IConnectOpts = {},
): React.ComponentClass<TProps> {
  return reduxConnect(opts.state, opts.dispatch)(component);
}
