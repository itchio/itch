import { actions } from "common/actions";
import { Dispatch } from "common/types";
import React from "react";
import Link from "renderer/basics/Link";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";
import { T } from "renderer/t";

const DisabledBrowserContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  overflow: hidden;

  background: ${(props) => props.theme.meatBackground};
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

class DisabledBrowser extends React.PureComponent<Props> {
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
    const { dispatch } = this.props;
    dispatch(actions.updatePreferences({ disableBrowser: false }));
  };
}

interface Props {
  dispatch: Dispatch;
}

export default hook()(DisabledBrowser);
