/**
 * Typings for https://github.com/slmgc/react-hint
 */
declare module "react-hint" {
  import * as React from "react";

  class ReactHint extends React.PureComponent<any, any> {}
  function ReactHintFactory(r: any): typeof ReactHint;

  export = ReactHintFactory;
}
