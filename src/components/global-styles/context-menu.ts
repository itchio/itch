import { css, baseColors } from "../styles";
import { darken, lighten } from "polished";

export default css`
  .react-contextmenu {
    min-width: 160px;
    padding: 5px 0;
    margin: 2px 0 0;
    font-size: 14px;
    text-align: left;
    background-color: ${baseColors.swissCoffee};
    background-clip: padding-box;
    border: 1px solid ${lighten(0.05, baseColors.swissCoffee)};
    box-shadow: 0 0 2px ${darken(0.05, baseColors.swissCoffee)};
    border-radius: 1px;
    outline: none;
    opacity: 0;
    pointer-events: none;
    transition: opacity 250ms ease !important;
    z-index: 9000;
  }

  .react-contextmenu.react-contextmenu--visible {
    opacity: 1;
    pointer-events: auto;
  }

  .react-contextmenu-item {
    padding: 3px 12px;
    font-weight: 400;
    line-height: 1.5;
    color: ${darken(0.2, baseColors.codGray)};
    text-shadow: 1px 1px 1px ${baseColors.swissCoffee};
    text-align: inherit;
    white-space: nowrap;
    background: 0 0;
    border: 0;
    cursor: pointer;

    &:focus {
      outline: 0;
    }
  }

  .react-contextmenu-item.react-contextmenu-item--active,
  .react-contextmenu-item.react-contextmenu-item--selected {
    cursor: pointer;
    background-color: ${darken(0.1, baseColors.swissCoffee)};
  }

  .react-contextmenu-item.react-contextmenu-item--disabled,
  .react-contextmenu-item.react-contextmenu-item--disabled:hover {
    color: ${baseColors.silverChalice};
    background-color: transparent;
    border-color: rgba(0, 0, 0, 0.15);
  }

  .react-contextmenu-item--divider {
    margin-bottom: 3px;
    padding: 2px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.15);
    cursor: inherit;
  }
  .react-contextmenu-item--divider:hover {
    background-color: transparent;
    border-color: rgba(0, 0, 0, 0.15);
  }

  .react-contextmenu-item.react-contextmenu-submenu {
    padding: 0;
  }

  .react-contextmenu-item.react-contextmenu-submenu > .react-contextmenu-item {
    padding-right: 30px;
  }

  .react-contextmenu-item.react-contextmenu-submenu
    > .react-contextmenu-item:after {
    content: "▶";
    display: inline-block;
    position: absolute;
    right: 7px;
  }

  .example-multiple-targets::after {
    content: attr(data-count);
    display: block;
  }
`;
