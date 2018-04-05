import React from "react";
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
  return <div {...restProps}>{children}</div>;
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
    border-radius: 2px;

    background: ${props => props.theme.itemBackground};
    border: 1px solid #191919;

    &.pristine {
      .cell--title {
        font-weight: bold;
      }
    }
  }

  .cell--title {
    ${styles.singleLine()};
    line-height: 1.6;

    font-size: ${props => props.theme.fontSizes.large};
  }

  .bubble {
    background: rgba(255, 255, 255, 0.9);
    color: black;
    border-radius: 4px;
    padding: 2px;
    text-transform: lowercase;
    font-weight: normal;
    font-size: 90%;
    margin-left: 4px;
  }

  .cell--actions {
    margin-top: 4px;
    display: flex;
    flex-direction: row;
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
