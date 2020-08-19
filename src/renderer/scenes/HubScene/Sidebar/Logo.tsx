import classNames from "classnames";
import { actions } from "common/actions";
import { Dispatch } from "common/types";
import React from "react";
import { hook } from "renderer/hocs/hook";
import { modals } from "common/modals";
import styled from "renderer/styles";
import { ambientWind } from "common/util/navigation";
import { isSecretClick } from "common/helpers/secret-click";

const LogoDiv = styled.div`
  text-align: center;
  cursor: pointer;

  margin-top: 10px;
  height: 59px;

  img {
    width: 110px;
    margin: 10px 0;
  }
`;

class Logo extends React.PureComponent<Props> {
  render() {
    const { appVersion } = this.props;

    return (
      <LogoDiv
        title={appVersion}
        className={classNames("logo-div")}
        onClick={this.onClick}
      >
        <img src={require("static/images/logos/app-white.svg").default} />
      </LogoDiv>
    );
  }

  onClick = (e: React.MouseEvent<any>) => {
    if (isSecretClick(e)) {
      const { dispatch } = this.props;
      dispatch(
        actions.openModal(
          modals.secretSettings.make({
            wind: "root",
            title: "Secret settings",
            message: "",
            widgetParams: {},
          })
        )
      );
      return;
    }

    if (e.button === 0) {
      const { dispatch } = this.props;
      dispatch(
        actions.openUserMenu({
          wind: ambientWind(),
          clientX: e.clientX,
          clientY: e.clientY,
        })
      );
    }
  };
}

interface Props {
  dispatch: Dispatch;
  appVersion: string;
}

export default hook((map) => ({
  appVersion: map((rs) => rs.system.appVersion),
}))(Logo);
