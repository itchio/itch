import styled from "renderer/styles";

export const SidebarSection = styled.div`
  color: ${props => props.theme.ternaryText};

  padding-left: 14px;
  margin: 12px 0;

  display: flex;
  flex-shrink: 0;
  align-items: center;

  a {
    color: ${props => props.theme.secondaryText};
    text-decoration: none;
    font-size: 16px;

    &:hover {
      color: ${props => props.theme.baseText};
    }
  }
`;

export const SidebarHeading = styled.span`
  text-transform: uppercase;
  font-weight: bold;
`;
