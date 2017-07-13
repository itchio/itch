import * as React from "react";

export interface IRowHandlerParams {
  e?: React.MouseEvent<any>;
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
}

const emptyString = "";

/**
 * Default row renderer for Table.
 */
export default function defaultRowRenderer(params: IRowRendererParams) {
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

  if (onRowClick || onRowDoubleClick || onRowMouseOver || onRowMouseOut) {
    if (onRowClick) {
      props.onClick = (e: React.MouseEvent<any>) =>
        onRowClick({ e, index, rowData });

      // `onClick` doesn't get us middle clicks, which we want.
      props.onMouseDown = (e: React.MouseEvent<any>) => {
        if (e.button === 1) {
          e.preventDefault();

          // middle-click
          onRowClick({ e, index, rowData });
        }
      };

      // and this gets us right clicks
      props.onContextMenu = (e: React.MouseEvent<any>) => {
        // middle-click
        onRowClick({ e: { ...e, button: 2 }, index, rowData });
      };
    }
    if (onRowDoubleClick) {
      props.onDoubleClick = (e: React.MouseEvent<any>) =>
        onRowDoubleClick({ e, index, rowData });
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
      className={`table-item ${className || emptyString}`}
      data-game-id={rowData ? rowData.id : -1}
      key={key}
      style={style}
    >
      {columns}
    </div>
  );
}
