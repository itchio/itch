import * as React from "react";
import { getImagePath } from "../../os/resources";
import styled from "../styles";
import { createStructuredSelector } from "reselect";
import * as classNames from "classnames";

import { connect } from "../connect";

import { actions, dispatcher } from "../../actions";
import { IRootState } from "../../types/index";

class Logo extends React.PureComponent<IDerivedProps> {
  render() {
    const { appVersion, focused } = this.props;

    return (
      <LogoDiv
        className={classNames("logo-div", { dimmed: !focused })}
        onClick={this.onClick}
        data-rh-at="bottom"
        data-rh={`itch v${appVersion}`}
      >
        <img src={getImagePath("logos/app-white.svg")} />
      </LogoDiv>
    );
  }

  onClick = (e: React.MouseEvent<any>) => {
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
  focused: boolean;

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

  &.dimmed {
    opacity: 0.2;
  }
`;

export default connect(Logo, {
  state: createStructuredSelector({
    appVersion: (rs: IRootState) => rs.system.appVersion,
    focused: (rs: IRootState) => rs.ui.mainWindow.focused,
  }),
  dispatch: dispatch => ({
    navigate: dispatcher(dispatch, actions.navigate),
    openModal: dispatcher(dispatch, actions.openModal),
  }),
});
