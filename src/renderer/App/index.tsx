import React from "react";
import { Sidebar } from "renderer/App/Sidebar";
import { Webview } from "renderer/App/Webview";
const Gate = React.lazy(() => import("renderer/Gate"));
import styled from "renderer/styles";
import { useProfile } from "renderer/contexts";

const AppDiv = styled.div`
  background: ${props => props.theme.baseBackground};
  display: flex;
  flex-direction: row;

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

export const App = () => {
  let profile = useProfile();

  if (!profile) {
    return <Gate />;
  }

  return (
    <AppDiv>
      <Sidebar />
      <MainDiv>
        <Webview />
      </MainDiv>
    </AppDiv>
  );
};

export default App;
