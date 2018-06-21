import styled from "renderer/styles";

export default styled.div`
  font-weight: normal;
  text-transform: lowercase;
  font-size: ${props => props.theme.fontSizes.baseText};
  color: ${props => props.theme.bundle};
  margin-left: 1em;
`;
