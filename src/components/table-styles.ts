import { darken } from "polished";
import { css } from "./styles";

export const tableStyles = () => css`
  font-size: ${props => props.theme.fontSizes.large};

  .ReactVirtualized__Grid {
    outline: none;
  }

  .ReactVirtualized__Table__headerRow {
    text-transform: initial;
    font-weight: normal;
    font-size: 90%;
    background: rgba(0, 0, 0, 0.3);
  }

  .ReactVirtualized__Table__row,
  .ReactVirtualized__Table__headerRow {
    border-left: 2px solid transparent;
  }

  .ReactVirtualized__Table__row {
    background-color: ${props => props.theme.meatBackground};
    outline: 0;

    &:hover {
      background-color: ${props => darken(0.05, props.theme.meatBackground)};
      border-color: ${props => props.theme.accent};
      cursor: pointer;
    }
  }

  .ReactVirtualized__Table__sortableHeaderColumn {
    height: 100%;
    padding: 12px 0;

    outline: 0;
  }

  .ReactVirtualized__Table__rowColumn {
    position: relative;

    &.secondary {
      font-size: 90%;
      color: ${props => props.theme.secondaryText};
    }
  }

  .ReactVirtualized__Table__sortableHeaderIcon {
    transform: translateX(50%) scale(2, 2);
  }
`;
