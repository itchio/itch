import styled from "renderer/styles";

export default styled.div`
  font-weight: normal;
  text-transform: lowercase;
  font-size: ${(props) => props.theme.fontSizes.smaller};
  color: ${(props) => props.theme.bundle};
  margin-left: 0.5em;
  border: 1px solid;
  border-radius: 2px;
  padding: 0 4px;
  opacity: 0.7;
`;
