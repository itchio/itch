import React from "react";

import styled from "renderer/styles";
import { T } from "renderer/t";

import {
  connect,
  actionCreatorsList,
  Dispatchers,
} from "renderer/hocs/connect";
import Link from "renderer/basics/Link";

const DisabledBrowserContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  overflow: hidden;

  background: ${props => props.theme.meatBackground};
`;

const DisabledBrowserDiv = styled.div`
  width: 100%;
  text-align: center;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const Spacer = styled.div`
  height: 1px;
  width: 10px;
`;

class DisabledBrowser extends React.PureComponent<Props & DerivedProps> {
  render() {
    return (
      <DisabledBrowserContainer>
        <DisabledBrowserDiv>
          {T(["browser.disabled"])}
          <Spacer />
          <Link label={T(["browser.reenable"])} onClick={this.onReenable} />
        </DisabledBrowserDiv>
      </DisabledBrowserContainer>
    );
  }

  onReenable = () => {
    this.props.updatePreferences({ disableBrowser: false });
  };
}

interface Props {
  url: string;
}

const actionCreators = actionCreatorsList("updatePreferences");

type DerivedProps = Dispatchers<typeof actionCreators>;

export default connect<Props>(
  DisabledBrowser,
  { actionCreators }
);
