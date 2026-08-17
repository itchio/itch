import styled from "renderer/styles";

export const ExpandedSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const ExpandedLabel = styled.div`
  color: ${(props) => props.theme.secondaryText};
  text-transform: uppercase;
  font-size: 75%;
  letter-spacing: 0.05em;
`;
