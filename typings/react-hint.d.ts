/**
 * Typings for https://github.com/slmgc/react-hint
 */
declare module "react-hint" {
  import React from "react";

  interface Props {
    events?: boolean;
    // null means "no tooltip content"; react-hint renders the result
    // directly as a React child, where null is valid
    onRenderContent: (target: HTMLElement, content: any) => JSX.Element | null;
  }

  function ReactHintFactory(r: any): React.ComponentType<Props> {}

  export = ReactHintFactory;
}
