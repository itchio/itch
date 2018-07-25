/**
 * Typings for https://github.com/okonet/react-container-dimensions
 */
declare module "react-container-dimensions" {
  import React from "react";

  interface RenderParams {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
  }
  type RenderFunc = (params: RenderParams) => JSX.Element;
  interface Props {
    children: JSX.Element | RenderFunc;
  }
  declare class ContainerDimensions extends React.Component<Props> {}
  export default ContainerDimensions;
}
