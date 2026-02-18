import { css, theme } from "renderer/styles";

export default css`
  .react-tabs__tab-list {
    margin: 0 0 10px;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    border-bottom: 1px solid ${theme.prefBorder};
  }

  .react-tabs__tab {
    list-style: none;
    display: inline-block;
    margin: 0 6px -1px 0;
    padding: 9px 12px 7px;
    color: ${theme.secondaryText};
    border: 1px solid transparent;
    border-bottom: none;
    background: transparent;
    transition: color 0.12s ease, background-color 0.12s ease,
      border-color 0.12s ease;
  }

  .react-tabs__tab:hover {
    cursor: pointer;
    color: ${theme.baseText};
    background: rgba(255, 255, 255, 0.03);
  }

  .react-tabs__tab--selected,
  .react-tabs__tab--selected:hover {
    color: ${theme.baseText};
    background: ${theme.sidebarBackground};
    border-color: ${theme.prefBorder};
    border-bottom-color: ${theme.sidebarBackground};
  }

  .react-tabs__tab--disabled {
    color: ${theme.ternaryText};
    cursor: default;
  }

  .react-tabs__tab:focus {
    outline: none;
  }

  .react-tabs__tab:focus:after {
    content: none;
    display: none;
  }

  .react-tabs__tab:focus-visible {
    border-color: ${theme.accent};
    box-shadow: 0 0 0 1px ${theme.accent};
  }
`;
