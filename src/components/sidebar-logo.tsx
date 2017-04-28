
import * as React from "react";
import {resolve} from "path";
import styled from "./styles";

import {connect} from "./connect";

import * as actions from "../actions";
import {dispatcher} from "../constants/action-types";

const Logo = styled.div`
  text-align: center;
  cursor: pointer;

  img {
    width: 120px;
    margin: 10px 0;
  }
`;

class SidebarLogo extends React.Component<IDerivedProps, void> {
  render() {
    const {navigate, appVersion} = this.props;

    return <Logo
        onClick={(e) => navigate("featured")}
        data-rh-at="bottom" data-rh={`itch v${appVersion}`}>
      <img src={resolve(__dirname, "../static/images/logos/app-white.svg")}/>
    </Logo>;
  }
}

interface IDerivedProps {
  appVersion: string;

  navigate: typeof actions.navigate;
}

export default connect(SidebarLogo, {
  state: (state) => ({
    appVersion: state.system.appVersion,
  }),
  dispatch: (dispatch) => ({
    navigate: dispatcher(dispatch, actions.navigate),
  }),
});
