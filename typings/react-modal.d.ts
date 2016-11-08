
/**
 * Typings for https://github.com/rackt/react-modal
 */
declare module 'react-modal' {
  import * as React from "react";

  class ReactModal extends React.Component<any, any> {
    static setAppElement(el: string): void;
  }
  export = ReactModal;
}