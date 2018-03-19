import * as React from "react";

import styled from "./styles";
import format from "./format";

import { connect, actionCreatorsList, Dispatchers } from "./connect";
import Link from "./basics/link";

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

class DisabledBrowser extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    return (
      <DisabledBrowserContainer>
        <DisabledBrowserDiv>
          {format(["browser.disabled"])}
          <Spacer />
          <Link
            label={format(["browser.reenable"])}
            onClick={this.onReenable}
          />
        </DisabledBrowserDiv>
      </DisabledBrowserContainer>
    );
  }

  onReenable = () => {
    this.props.updatePreferences({ disableBrowser: false });
  };
}

interface IProps {
  url: string;
}

const actionCreators = actionCreatorsList("updatePreferences");

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(DisabledBrowser, { actionCreators });
