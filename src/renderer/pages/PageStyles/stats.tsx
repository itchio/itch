import styled from "styled-components";

export const StatBox = styled.div`
  padding: 0 4px;
  margin: 4px;
  margin-right: 16px;
  font-size: ${(props) => props.theme.fontSizes.baseText};
  color: ${(props) => props.theme.secondaryText};
  line-height: 1.4;
  font-weight: lighter;
  text-align: center;
`;

export const StatNumber = styled.div`
  font-size: ${(props) => props.theme.fontSizes.larger};
  color: ${(props) => props.theme.baseText};
  min-width: 3em;
`;
