import React from "react";
import styled from "renderer/styles";
import { createStructuredSelector } from "reselect";
import classNames from "classnames";

import {
  connect,
  actionCreatorsList,
  Dispatchers,
} from "renderer/hocs/connect";

import { IRootState } from "common/types";
import { modalWidgets } from "renderer/modal-widgets/index";

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

class Logo extends React.PureComponent<DerivedProps> {
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
      const { openModal } = this.props;
      openModal(
        modalWidgets.secretSettings.make({
          window: "root",
          title: "Secret options",
          message: "",
          widgetParams: {},
        })
      );
      return;
    }

    const { navigate } = this.props;
    navigate({ window: "root", url: "itch://featured" });
  };
}

const actionCreators = actionCreatorsList("navigate", "openModal");

type DerivedProps = Dispatchers<typeof actionCreators> & {
  appVersion: string;
};

export default connect(
  Logo,
  {
    state: createStructuredSelector({
      appVersion: (rs: IRootState) => rs.system.appVersion,
    }),
    actionCreators,
  }
);
