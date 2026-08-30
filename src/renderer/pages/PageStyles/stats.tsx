import styled from "styled-components";

export const StatBox = styled.div`
  font-size: ${(props) => props.theme.fontSizes.baseText};
  color: ${(props) => props.theme.secondaryText};
  line-height: 1.4;
  text-align: center;
`;

export const StatNumber = styled.div`
  font-size: ${(props) => props.theme.fontSizes.larger};
  color: ${(props) => props.theme.baseText};
  font-variant-numeric: tabular-nums;
  min-width: 3em;
`;
