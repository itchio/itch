
import env from "../env";

import {createSelector} from "reselect";

import {connect as reduxConnect} from "react-redux";
import {ILocalizer, getT} from "../localizer";

import {IAppState} from "../types";
import {IDispatch} from "../constants/action-types";

const identity = (x: any) => x;

const i18nPropsSelector = createSelector(
  (state: IAppState) => state.i18n,
  (i18n) => {
    const {lang, strings} = i18n;
    if (env.name === "test") {
      return {t: identity};
    } else {
      return {t: getT(strings, lang)};
    }
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

  const augmentedMapStateToProps = (initialState: IAppState, initialProps: any) => {
    const augment = createSelector(
      (state: IAppState, base: any) => i18nPropsSelector(state),
      (state: IAppState, base: any) => base,
      (i18nProps, base) => {
        console.log("based changed, keys =", Object.keys(base).join(", "));
        return {...base, ...i18nProps};
      },
    );

    if (!opts.state) {
      return (state: IAppState, props: any) => i18nPropsSelector(state);
    }

    const base = opts.state(initialState, initialProps);
    if (typeof base === "function") {
      return (state: IAppState, props: any) => augment(state, base(state, props));
    } else {
      return (state: IAppState, props: any) => augment(state, opts.state(state, props));
    }
  };
  const mapDispatchToProps = opts.dispatch;
  return reduxConnect(augmentedMapStateToProps, mapDispatchToProps)(component);
}
