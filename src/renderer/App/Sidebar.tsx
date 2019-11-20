import React from "react";
import styled from "renderer/styles";
import Icon from "renderer/basics/Icon";

const SidebarDiv = styled.div`
  flex-basis: 240px;
  background: ${props => props.theme.sidebarBackground};

  border-right: 2px solid ${props => props.theme.sidebarBorder};

  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LogoImg = styled.img`
  width: 110px;
  padding-top: 20px;
  padding-bottom: 20px;
`;

const SidebarElement = styled.a`
  width: 100%;
  text-align: left;
  padding: 20px 10px;

  transition: 0.2s all;
  color: ${props => props.theme.secondaryText};

  &:hover {
    background: ${props => props.theme.sidebarEntryFocusedBackground};
    color: ${props => props.theme.baseText};
  }

  text-decoration: none;
  font-size: 18px;

  .icon {
    display: inline-block;
    width: 2em;
    text-align: center;
  }
`;

const Spacer = styled.div`
  flex-grow: 1;
`;

export const Sidebar = () => {
  return (
    <SidebarDiv>
      <LogoImg src={require("static/images/logos/app-white.svg")} />
      <SidebarElement href="itch://featured">
        <Icon icon="earth" /> Explore
      </SidebarElement>
      <SidebarElement href="itch://library">
        <Icon icon="heart-filled" /> Library
      </SidebarElement>
      <SidebarElement href="itch://collections">
        <Icon icon="video_collection" /> Collections
      </SidebarElement>
      <SidebarElement href="itch://dashboard">
        <Icon icon="archive" /> Dashboard
      </SidebarElement>
      <Spacer />
      <SidebarElement href="itch://downloads">
        <Icon icon="download" /> Downloads
      </SidebarElement>
      <SidebarElement href="itch://preferences">
        <Icon icon="cog" /> Preferences
      </SidebarElement>
    </SidebarDiv>
  );
};
