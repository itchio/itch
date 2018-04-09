import React from "react";
import styled from "../styles";

interface IGridSizes {
  rowHeight: number;
  frescoHeight: number;
  globalPadding: number;
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

  .grid--row {
    border-radius: 2px;
    background: ${props => props.theme.itemBackground};
    border: 1px solid #191919;

    margin: 0 ${props => props.sizes.globalPadding}px;

    position: absolute;
    left: 0;
    right: 0;

    height: ${props => props.sizes.rowHeight}px;
    display: flex;
    flex-direction: column;

    &:hover {
      cursor: pointer;
    }

    .title {
      padding: 18px 12px;
      padding-bottom: 8px;
      flex-shrink: 0;
      font-size: ${props => props.theme.fontSizes.huge};
      font-weight: bold;
      margin-bottom: 0;
    }

    .fresco {
      display: flex;
      flex-direction: row;
      flex-grow: 1;
      overflow-x: hidden;
      position: relative;
      height: ${props => props.sizes.frescoHeight}px;
      align-items: center;
      padding: 5px 12px;
    }

    .fresco--cover {
      width: ${props => props.sizes.frescoHeight / 0.79}px;
      height: ${props => props.sizes.frescoHeight}px;
      margin-right: 12px;
      flex-shrink: 0;
      padding-bottom: 0;
      object-fit: cover;

      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 2px;
    }

    .info {
      flex-shrink: 0;
      padding: 6px 12px;
      color: ${props => props.theme.secondaryText};

      display: flex;

      .icon {
        margin-right: 7px;
        flex-shrink: 0;
      }

      .spacer {
        flex-basis: 10px;
      }

      .nice-ago {
        margin-left: 5px;
      }
    }
  }
`;

export const GridDiv = styled.div`
  flex-grow: 1;
  overflow-y: scroll;
  position: relative;
`;
