
import * as React from "react";
import Ink = require("react-ink");

interface IRowHandlerParams {
  index: number;
  rowData: any;
}

interface IRowRendererParams {
  className: string;
  columns: JSX.Element[];
  index: number;
  isScrolling: boolean;
  onRowClick?: (params: IRowHandlerParams) => void;
  onRowDoubleClick?: (params: IRowHandlerParams) => void;
  onRowMouseOver?: (params: IRowHandlerParams) => void;
  onRowMouseOut?: (params: IRowHandlerParams) => void;
  rowData: any;
  style: React.CSSProperties;
  key: string;
};

/**
 * Default row renderer for Table.
 */
export default function defaultRowRenderer (params: IRowRendererParams) {
  const {
    className,
    columns,
    index,
    onRowClick,
    onRowDoubleClick,
    onRowMouseOver,
    onRowMouseOut,
    rowData,
    style,
    key,
  } = params;

  const props: any = {};

  if (
    onRowClick ||
    onRowDoubleClick ||
    onRowMouseOver ||
    onRowMouseOut
  ) {
    if (onRowClick) {
      props.onClick = () => onRowClick({ index, rowData });
    }
    if (onRowDoubleClick) {
      props.onDoubleClick = () => onRowDoubleClick({ index, rowData });
    }
    if (onRowMouseOut) {
      props.onMouseOut = () => onRowMouseOut({ index, rowData });
    }
    if (onRowMouseOver) {
      props.onMouseOver = () => onRowMouseOver({ index, rowData });
    }
  }

  return (
    <div
      {...props}
      className={className}
      key={key}
      style={style}
    >
      {columns}
      <Ink/>
    </div>
  );
}
