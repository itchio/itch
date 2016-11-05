
import * as env from "../env";

import {createSelector} from "reselect";

import {connect as reduxConnect} from "react-redux";
import {getT} from "../localizer";

import {IState} from "../types/db";

const identity = (x: any) => x;

const tMaker = createSelector(
  (state: IState) => state.i18n,
  (i18n) => {
    const {lang, strings} = i18n;
    if (env.name === "test") {
      return identity;
    } else {
      return getT(strings, lang);
    }
  }
);

const augment = createSelector(
  (state: IState, base: any) => tMaker(state),
  (state: IState, base: any) => base,
  (t, base) => {
    return Object.assign({}, base, {t});
  }
);

// TODO: type better (typescript has multiple dispatch right?)
export function connect (mapStateToProps: any, mapDispatchToProps?: any) {
  const augmentedMapStateToProps = (state: any, props: any) => {
    if (mapStateToProps) {
      const base = mapStateToProps(state, props);
      if (typeof base === "function") {
        return (innerState: any, innerProps: any) => augment(innerState, base(innerState, innerProps));
      } else {
        return augment(state, base);
      }
    } else {
      return augment(state, {});
    }
  };
  return reduxConnect(augmentedMapStateToProps, mapDispatchToProps);
}
