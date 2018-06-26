/**
 * Typings for https://github.com/slmgc/react-hint
 */
declare module "react-hint" {
  import React from "react";

  interface Props {
    events?: boolean;
    onRenderContent: (target: HTMLElement, content: any) => JSX.Element;
  }

  function ReactHintFactory(r: any): React.ComponentType<Props> {}

  export = ReactHintFactory;
}
