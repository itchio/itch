import * as React from "react";
import styled, * as styles from "../styles";

interface IGridSizes {
  rowHeight: number;
  globalPadding: number;
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

  .grid--row {
    ${styles.hubItemStyle()};

    margin: 0 ${props => props.sizes.globalPadding}px;

    position: absolute;
    left: 0;
    right: 0;

    height: ${props => props.sizes.rowHeight}px;
    display: flex;
    flex-direction: column;
    filter: brightness(80%);

    &:hover {
      filter: brightness(100%);
      cursor: pointer;
    }

    .title {
      padding: 12px 6px 6px 8px;
      flex-shrink: 0;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 0;
    }

    .fresco {
      display: flex;
      flex-direction: row;
      flex-grow: 1;
      overflow-x: hidden;
      position: relative;

      padding: 5px;
    }

    .fresco--cover {
      width: ${props => (props.sizes.rowHeight - 60) / 0.8}px;
      margin-right: 7px;
      flex-shrink: 0;
      padding-bottom: 0;
      object-fit: cover;
    }

    .info {
      flex-shrink: 0;
      padding: 6px;
      color: ${props => props.theme.secondaryText};

      display: flex;

      .icon {
        margin-right: 7px;
        flex-shrink: 0;
      }

      .spacer {
        flex-grow: 1;
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
