
import {css} from "../styles";

export default css`
  .react-hint-container {
    pointer-events: none;
  }

  .react-hint__content {
    padding: 5px;
    border-radius: 2px;
    background: $tooltip-background-color;
    color: $tooltip-text-color;
    font-size: 90%;
  }

  .react-hint--top:after {
    border-top-color: $tooltip-background-color;
  }

  .react-hint--left:after {
    border-left-color: $tooltip-background-color;
  }

  .react-hint--right:after {
    border-right-color: $tooltip-background-color;
  }

  .react-hint--bottom:after {
    border-bottom-color: $tooltip-background-color;
  }
`;
