import classNames from "classnames";
import { actions } from "common/actions";
import { Dispatch, RootState } from "common/types";
import React from "react";
import { connect } from "renderer/hocs/connect";
import { modalWidgets } from "renderer/modal-widgets/index";
import styled from "renderer/styles";
import { createStructuredSelector } from "reselect";

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

class Logo extends React.PureComponent<Props & DerivedProps> {
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
          modalWidgets.secretSettings.make({
            window: "root",
            title: "Secret options",
            message: "",
            widgetParams: {},
          })
        )
      );
      return;
    }

    const { dispatch } = this.props;
    dispatch(actions.navigate({ window: "root", url: "itch://featured" }));
  };
}

interface Props {
  dispatch: Dispatch;
}

interface DerivedProps {
  appVersion: string;
}

export default connect(
  Logo,
  {
    state: createStructuredSelector({
      appVersion: (rs: RootState) => rs.system.appVersion,
    }),
  }
);
