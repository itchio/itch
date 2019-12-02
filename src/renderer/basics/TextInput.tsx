import styled from "renderer/styles";

export const TextInput = styled.input`
  transition: all ease-out 0.1s;

  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.baseText};
  border: 1px solid ${props => props.theme.inputBorder};
  padding: 0.4em;

  &:focus {
    outline: none;
    border: 1px solid ${props => props.theme.inputBorderFocused};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const LargeTextInput = styled(TextInput)`
  font-size: ${props => props.theme.fontSizes.large};
  padding: 0.8em;
`;
