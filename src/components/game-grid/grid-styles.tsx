import * as React from "react";
import styled, * as styles from "../styles";

interface IGridSizes {
  columnWidth: number;
  rowHeight: number;
}

interface IGridProps {
  sizes: IGridSizes;
  children: JSX.Element | JSX.Element[];
}

const StylableDiv = (props: IGridProps) => {
  const { sizes, children, ...restProps } = props;
  return (
    <div {...restProps}>
      {children}
    </div>
  );
};

export const GridContainerDiv = styled(StylableDiv)`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .grid--cell {
    position: absolute;
    transition: transform 0.2s;

    width: ${props => props.sizes.columnWidth}px;
    height: ${props => props.sizes.rowHeight}px;
    border: 2px solid yellow;
    overflow: hidden;

    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
    border-radius: 2px;

    background: #232222;
    border: 1px solid #191919;
  }

  .cell--title {
    ${styles.singleLine()};
    line-height: 1.6;

    font-size: ${props => props.theme.fontSizes.large};
  }

  .cell--undercover {
    margin: 8px 12px;
  }
`;

export const GridDiv = styled.div`
  flex-grow: 1;
  overflow-y: scroll;
  position: relative;

  margin-left: 20px;
`;
