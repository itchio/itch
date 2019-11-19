import React from "react";
import styled from "renderer/styles";

const SidebarDiv = styled.div`
  flex-basis: 300px;
  background: ${props => props.theme.sidebarBackground};

  border-right: 2px solid ${props => props.theme.sidebarBorder};
`;

export const Sidebar = () => {
  return <SidebarDiv style={{ flexBasis: "300px" }}>Sidebar!</SidebarDiv>;
};
