import styled from "styled-components";
import { fontSizes } from "common/theme";

export const TextInput = styled.input`
  transition: all ease-out 0.1s;

  background-color: ${(p) => p.theme.colors.inputBg};
  color: ${(p) => p.theme.colors.inputText};
  border: 1px solid ${(p) => p.theme.colors.inputBorder};
  padding: 0.4em;

  &:focus {
    outline: none;
    border: 1px solid ${(p) => p.theme.colors.inputBorderFocus};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const LargeTextInput = styled(TextInput)`
  font-size: ${fontSizes.large};
  padding: 0.8em;
`;
