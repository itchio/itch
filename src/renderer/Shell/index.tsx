import React from "react";
import { Sidebar } from "renderer/Shell/Topbar";
import { Webview } from "renderer/Shell/Webview";
const Gate = React.lazy(() => import("renderer/Gate"));
import styled from "renderer/styles";
import { useProfile } from "renderer/contexts";

const ShellDiv = styled.div`
  border: 1px solid rgb(56, 52, 52);

  background: ${props => props.theme.baseBackground};
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
    return <Gate />;
  }

  return (
    <ShellDiv>
      <Sidebar />
      <MainDiv>
        <Webview />
      </MainDiv>
    </ShellDiv>
  );
};

export default Shell;
