import React from "react";
import {
  connect,
  DispatchProp,
  Matching,
  InferableComponentEnhancerWithProps,
} from "react-redux";
import { RootState, Subtract } from "common/types";
import {
  createStructuredSelector,
  Selector,
  ParametricSelector,
} from "reselect";
import { AnyAction } from "redux";

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

export function hook<DerivedProps = {}>(
  makeSelectors?: (f: MakeSelectorFunc) => {
    [K in keyof DerivedProps]: Selector<RootState, DerivedProps[K]>;
  }
): InferableComponentEnhancerWithProps<DerivedProps & DispatchProp<any>, {}> {
  if (!makeSelectors) {
    return connect();
  }
  const selectors = makeSelectors(identity);
  // FIXME: dirty typing workaround, seems to work in practice
  return connect(
    createStructuredSelector<RootState, DerivedProps>(selectors)
  ) as unknown as any;
}

export function hookWithProps<InputProps>(
  inputComponent: React.ComponentType<InputProps>
) {
  // each mapper must produce exactly what the component's prop declares —
  // this is what keeps derived props from silently lying about nullability
  return function <K extends keyof InputProps>(
    makeSelectors: (f: MakeParametricSelectorFunc<InputProps>) => {
      [P in K]: ParametricSelector<RootState, InputProps, InputProps[P]>;
    }
  ) {
    const selectors = makeSelectors(identity);
    return function (
      component: React.ComponentType<InputProps>
    ): React.ComponentType<
      Subtract<InputProps, Pick<InputProps, K> & DispatchProp<any>>
    > {
      return connect(
        createStructuredSelector<RootState, InputProps, Pick<InputProps, K>>(
          selectors
        )
      )(component as any) as any;
    };
  };
}
