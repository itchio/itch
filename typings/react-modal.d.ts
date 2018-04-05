/**
 * Typings for https://github.com/rackt/react-modal
 */
declare module "react-modal" {
  import React from "react";

  class ReactModal extends React.PureComponent<any, any> {
    static setAppElement(el: string): void;
  }
  export = ReactModal;
}
