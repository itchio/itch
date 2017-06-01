
import * as React from "react";
import {getImagePath} from "../../os/resources";
import styled from "../styles";
import {createStructuredSelector} from "reselect";

import {connect} from "../connect";

import * as actions from "../../actions";
import {dispatcher} from "../../constants/action-types";

class Logo extends React.PureComponent<IDerivedProps, void> {
  render() {
    const {navigate, appVersion} = this.props;

    return <LogoDiv
        onClick={(e) => navigate("featured")}
        data-rh-at="bottom" data-rh={`itch v${appVersion}`}>
      <img src={getImagePath("logos/app-white.svg")}/>
    </LogoDiv>;
  }
}

interface IDerivedProps {
  appVersion: string;

  navigate: typeof actions.navigate;
}

const LogoDiv = styled.div`
  text-align: center;
  cursor: pointer;
  -webkit-app-region: drag;

  margin-top: 10px;

  img {
    width: 120px;
    margin: 10px 0;
  }
`;

export default connect(Logo, {
  state: createStructuredSelector({
    appVersion: (state) => state.system.appVersion,
  }),
  dispatch: (dispatch) => ({
    navigate: dispatcher(dispatch, actions.navigate),
  }),
});
