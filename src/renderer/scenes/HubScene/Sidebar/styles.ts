import styled from "renderer/styles";

export const SidebarSection = styled.div`
  color: ${(props) => props.theme.ternaryText};

  padding-left: 14px;
  margin: 12px 0;

  display: flex;
  flex-shrink: 0;
  align-items: center;

  a {
    text-decoration: none;
    font-size: 16px;
    color: ${(props) => props.theme.secondaryText};
    &:hover {
      color: ${(props) => props.theme.secondaryTextHover};
    }

    &.active {
      color: ${(props) => props.theme.baseText};
      font-weight: 400;
    }

    display: flex;
    align-items: center;

    .icon {
      padding-right: 0.6em;
      font-size: 140%;
    }
  }
`;

export const SidebarHeading = styled.span`
  text-transform: uppercase;
  font-weight: bold;
`;
