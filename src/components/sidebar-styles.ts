
import styled from "styled-components";

export const Filler = styled.div`
  flex-grow: 1;
`;

export const SidebarSection = styled.div`
  color: ${props => props.theme.ternaryText};

  padding: 0 7px 0 14px;
  margin: 20px 0 8px 0;

  display: flex;
  flex-shrink: 0;
  align-items: center;
`;

export const SidebarHeading = styled.span`
  text-transform: uppercase;
  font-weight: bold;
`;
