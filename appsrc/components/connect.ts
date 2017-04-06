
import * as env from "../env";

import {createSelector} from "reselect";

import {connect as reduxConnect} from "react-redux";
import {ILocalizer, getT} from "../localizer";

import {IAppState} from "../types";
import {IDispatch} from "../constants/action-types";

const identity = (x: any) => x;

const tMaker = createSelector(
  (state: IAppState) => state.i18n,
  (i18n) => {
    const {lang, strings} = i18n;
    if (env.name === "test") {
      return identity;
    } else {
      return getT(strings, lang);
    }
  },
);

const augment = createSelector(
  (state: IAppState, base: any) => tMaker(state),
  (state: IAppState, base: any) => base,
  (t, base) => {
    return {...base, t};
  },
);

interface IStateMapper {
  (state: IAppState, props: any): any;
}

interface IDispatchMapper {
  (dispatch: IDispatch, props: any): any;
}

export interface I18nProps {
  t: ILocalizer;
}

interface IConnectOpts {
  state?: IStateMapper;
  dispatch?: IDispatchMapper;
}

export function connect <TProps> (
    component: React.ComponentClass<any>,
    opts: IConnectOpts = {}): React.ComponentClass<TProps> {
  const augmentedMapStateToProps = (state: IAppState, props: any) => {
    if (opts.state) {
      const base = opts.state(state, props);
      if (typeof base === "function") {
        return (innerState: IAppState, innerProps: any) => augment(innerState, base(innerState, innerProps));
      } else {
        return augment(state, base);
      }
    } else {
      return augment(state, {});
    }
  };
  const mapDispatchToProps = opts.dispatch;
  return reduxConnect(augmentedMapStateToProps, mapDispatchToProps)(component);
}
