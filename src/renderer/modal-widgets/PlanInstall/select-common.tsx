import styled from "styled-components";
import { singleLine } from "renderer/styles";

export const SelectValueDiv = styled.div`
  display: flex;
  flex-flow: row wrap;
  align-items: center;

  .spacer {
    width: 0.5em;
    flex-shrink: 0;
  }

  .title {
    font-size: 90%;
    ${singleLine};
  }

  .tag {
    color: ${(props) => props.theme.secondaryText};
    text-shadow: none;

    font-size: 80%;
    padding-right: 8px;
    &:last-child {
      padding-right: 0;
    }

    border-radius: ${(props) => props.theme.borderRadii.explanation};
    flex-shrink: 0;
    ${singleLine};
  }
`;
