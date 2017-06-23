/**
 * Typings for https://github.com/recharts/recharts
 */
declare module "recharts" {
  import * as React from "react";

  export class ResponsiveContainer extends React.PureComponent<
    IResponsiveContainerProps,
    any
  > {}

  export interface IResponsiveContainerProps {
    width?: string | number;
    height?: string | number;
  }

  export class AreaChart extends React.PureComponent<IAreaChartProps, any> {}

  export interface IAreaChartProps {
    margin?: {
      top?: number;
      right?: number;
      left?: number;
      bottom?: number;
    };
    data: any /** whoo, free-form! can't type that. */;
  }

  export class Area extends React.PureComponent<IAreaProps, any> {}

  export type AreaType = "monotone";

  export interface IAreaProps {
    type?: AreaType;
    curve?: boolean;
    dot?: boolean;
    isAnimationActive?: false;
    dataKey?: string;
    fill?: string;
    fillOpacity?: number;
  }
}
