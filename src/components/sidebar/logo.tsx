import * as React from "react";
import { getImagePath } from "../../os/resources";
import styled from "../styles";
import { createStructuredSelector } from "reselect";

import { connect } from "../connect";

import * as actions from "../../actions";
import { dispatcher } from "../../constants/action-types";

class Logo extends React.PureComponent<IDerivedProps> {
  render() {
    const { appVersion } = this.props;

    return (
      <LogoDiv
        className="logo-div"
        onClick={this.onClick}
        data-rh-at="bottom"
        data-rh={`itch v${appVersion}`}
      >
        <img src={getImagePath("logos/app-white.svg")} />
      </LogoDiv>
    );
  }

  onClick = (e: React.MouseEvent<any>) => {
    console.log("hi");
    if (e.shiftKey && e.ctrlKey) {
      const { openModal } = this.props;
      openModal({
        title: "Secret options",
        message: "",
        widget: "secret-settings",
        widgetParams: {},
      });
      return;
    }

    const { navigate } = this.props;
    navigate({ tab: "featured" });
  };
}

interface IDerivedProps {
  appVersion: string;

  navigate: typeof actions.navigate;
  openModal: typeof actions.openModal;
}

const LogoDiv = styled.div`
  text-align: center;
  cursor: pointer;

  margin-top: 10px;
  height: 69px;

  img {
    width: 120px;
    margin: 10px 0;
  }
`;

export default connect(Logo, {
  state: createStructuredSelector({
    appVersion: state => state.system.appVersion,
  }),
  dispatch: dispatch => ({
    navigate: dispatcher(dispatch, actions.navigate),
    openModal: dispatcher(dispatch, actions.openModal),
  }),
});
