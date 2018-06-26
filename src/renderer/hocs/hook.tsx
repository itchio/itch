import React from "react";
import { connect, DispatchProp } from "react-redux";
import { RootState, Subtract } from "common/types";
import {
  createStructuredSelector,
  Selector,
  ParametricSelector,
} from "reselect";

interface MakeSelectorFunc {
  <Result>(s: Selector<RootState, Result>): Selector<RootState, Result>;
}

interface MakeParametricSelectorFunc<InputProps> {
  <Result>(
    s: ParametricSelector<RootState, InputProps, Result>
  ): ParametricSelector<RootState, InputProps, Result>;
}

function identity<T>(t: T) {
  return t;
}

export function hook<DerivedProps>(
  makeSelectors?: (
    f: MakeSelectorFunc
  ) => { [K in keyof DerivedProps]: Selector<RootState, DerivedProps[K]> }
) {
  if (!makeSelectors) {
    return connect();
  }

  const selectors = makeSelectors(identity);
  return function<Props extends DerivedProps & DispatchProp<any>>(
    component: React.ComponentType<Props>
  ) {
    return connect(
      createStructuredSelector<RootState, DerivedProps>(selectors)
    )(component);
  };
}

export function hookWithProps<InputProps>(
  inputComponent: React.ComponentType<InputProps>
) {
  return function<DerivedProps>(
    makeSelectors: (
      f: MakeParametricSelectorFunc<InputProps>
    ) => {
      [K in keyof DerivedProps]: ParametricSelector<
        RootState,
        InputProps,
        DerivedProps[K]
      >
    }
  ) {
    const selectors = makeSelectors(identity);
    return function<
      Props extends InputProps & DerivedProps & DispatchProp<any>
    >(
      component: React.ComponentType<Props>
    ): React.ComponentType<
      Subtract<InputProps, DerivedProps & DispatchProp<any>>
    > {
      return connect(
        createStructuredSelector<RootState, InputProps, DerivedProps>(selectors)
      )(component) as any;
    };
  };
}
