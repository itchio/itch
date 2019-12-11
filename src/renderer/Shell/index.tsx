import React from "react";
import { Topbar } from "renderer/Shell/Topbar";
import { Webview } from "renderer/Shell/Webview";
const Gate = React.lazy(() => import("renderer/Gate"));
import { useProfile } from "renderer/contexts";
import styled from "styled-components";

const ShellDiv = styled.div`
  border: 1px solid ${p => p.theme.colors.shellBorder};
  background: ${p => p.theme.colors.shellBg};

  display: flex;
  flex-direction: column;

  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  overflow: hidden;
`;

const MainDiv = styled.div`
  flex-grow: 1;
`;

export const Shell = () => {
  let profile = useProfile();

  if (!profile) {
    return (
      <ShellDiv>
        <Topbar />
        <Gate />
      </ShellDiv>
    );
  }

  return (
    <ShellDiv>
      <Topbar />
      <MainDiv>
        <Webview />
      </MainDiv>
    </ShellDiv>
  );
};

export default Shell;
