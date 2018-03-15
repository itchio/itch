import * as React from "react";
import styled from "../styles";
import { createStructuredSelector } from "reselect";
import * as classNames from "classnames";

import { connect, actionCreatorsList, Dispatchers } from "../connect";

import { IRootState } from "../../types/index";
import { modalWidgets } from "../modal-widgets/index";

const LogoDiv = styled.div`
  text-align: center;
  cursor: pointer;

  margin-top: 10px;
  height: 59px;

  img {
    width: 110px;
    margin: 10px 0;
  }

  &.dimmed {
    opacity: 0.2;
  }
`;

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
        <img src={require("../../static/images/logos/app-white.svg")} />
      </LogoDiv>
    );
  }

  onClick = (e: React.MouseEvent<any>) => {
    if (e.shiftKey && e.ctrlKey) {
      const { openModal } = this.props;
      openModal(
        modalWidgets.secretSettings.make({
          title: "Secret options",
          message: "",
          widgetParams: {},
        })
      );
      return;
    }

    const { navigate } = this.props;
    navigate({ url: "itch://featured" });
  };
}

const actionCreators = actionCreatorsList("navigate", "openModal");

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  appVersion: string;
  focused: boolean;
};

export default connect(Logo, {
  state: createStructuredSelector({
    appVersion: (rs: IRootState) => rs.system.appVersion,
    focused: (rs: IRootState) => rs.ui.mainWindow.focused,
  }),
  actionCreators,
});
