import * as React from "react";
import { connect } from "../connect";

// for debug purposes only
import chromeStore from "../../store/chrome-store";

import { IModalWidgetProps, ModalWidgetDiv } from "./modal-widget";

import { IAppState } from "../../types/index";
import * as actions from "../../actions";
import { dispatcher } from "../../constants/action-types";

import styled from "../styles";
import Button from "../basics/button";

const ControlsDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  .control {
    margin: 12px 0;
  }

  label {
    padding: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    border-left: 2px solid ${props => props.theme.prefBorder};
  }

  input[type=checkbox] {
    margin-right: .4em;
  }
`;

export class SecretSettings extends React.PureComponent<
  IProps & IDerivedProps
> {
  render() {
    const { status } = this.props;

    return (
      <ModalWidgetDiv>
        <ControlsDiv>
          <label className="control">
            <input
              type="checkbox"
              value="Redux logging"
              checked={status.reduxLoggingEnabled}
              onChange={this.toggleReduxLogging}
            />
            <span>Enable redux logging</span>
          </label>
          <Button
            className="control"
            primary={true}
            icon="repeat"
            onClick={this.onReload}
            label="Reload entire page"
          />
          <Button
            className="control"
            primary={true}
            icon="bug"
            onClick={this.onViewAppState}
            label="View app state"
          />
        </ControlsDiv>
      </ModalWidgetDiv>
    );
  }

  onReload = () => {
    window.location.reload();
  };

  onViewAppState = () => {
    this.props.openModal({
      title: "",
      message: "Entire app state: ",
      widget: "explore-json",
      widgetParams: {
        data: chromeStore.getState(),
      },
    });
  };

  toggleReduxLogging = () => {
    this.props.setReduxLoggingEnabled({
      enabled: !this.props.status.reduxLoggingEnabled,
    });
  };
}

export interface IExploreJsonParams {
  data: any;
}

interface IProps extends IModalWidgetProps {
  params: IExploreJsonParams;
}

interface IDerivedProps {
  status: IAppState["status"];

  setReduxLoggingEnabled: typeof actions.setReduxLoggingEnabled;
  openModal: typeof actions.openModal;
}

export default connect<IProps>(SecretSettings, {
  state: (state: IAppState) => ({
    status: state.status,
  }),
  dispatch: dispatch => ({
    setReduxLoggingEnabled: dispatcher(
      dispatch,
      actions.setReduxLoggingEnabled,
    ),
    openModal: dispatcher(dispatch, actions.openModal),
  }),
});
