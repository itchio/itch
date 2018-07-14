import classNames from "classnames";
import { actions } from "common/actions";
import { Dispatch } from "common/types";
import React from "react";
import { hook } from "renderer/hocs/hook";
import { modals } from "common/modals";
import styled from "renderer/styles";

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
        className={classNames("logo-div")}
        onClick={this.onClick}
        data-rh-at="bottom"
        data-rh={`itch v${appVersion}`}
      >
        <img src={require("static/images/logos/app-white.svg")} />
      </LogoDiv>
    );
  }

  onClick = (e: React.MouseEvent<any>) => {
    if (e.shiftKey && e.ctrlKey) {
      const { dispatch } = this.props;
      dispatch(
        actions.openModal(
          modals.secretSettings.make({
            wind: "root",
            title: "Secret options",
            message: "",
            widgetParams: {},
          })
        )
      );
      return;
    }

    const { dispatch } = this.props;
    dispatch(actions.navigate({ wind: "root", url: "itch://featured" }));
  };
}

interface Props {
  dispatch: Dispatch;
  appVersion: string;
}

export default hook(map => ({
  appVersion: map(rs => rs.system.appVersion),
}))(Logo);
