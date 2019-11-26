import { css, theme } from "renderer/styles";

export default css`
  .react-hint-container {
    pointer-events: none;
  }

  .react-hint__content {
    padding: 5px;
    border-radius: 2px;
    background: ${theme.tooltipBackground};
    color: ${theme.tooltipText};
    font-size: 90%;
  }

  .react-hint--top:after {
    border-top-color: ${theme.tooltipBackground};
  }

  .react-hint--left:after {
    border-left-color: ${theme.tooltipBackground};
  }

  .react-hint--right:after {
    border-right-color: ${theme.tooltipBackground};
  }

  .react-hint--bottom:after {
    border-bottom-color: ${theme.tooltipBackground};
  }
`;
