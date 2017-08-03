import * as React from "react";

export default function pure<P>(func: (props: P, context: any) => JSX.Element) {
  class PureComponentWrap extends React.PureComponent<P, {}> {
    render() {
      return func(this.props, this.context);
    }
  }
  return PureComponentWrap;
}
